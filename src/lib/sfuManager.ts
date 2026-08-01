import { Room, RoomEvent, LocalParticipant, RemoteParticipant, Track, LocalVideoTrack, LocalAudioTrack, createLocalTracks } from 'livekit-client';

export interface PeerMediaStream {
  userId: string;
  seatNumber: number;
  stream: MediaStream;
  isVideoOn: boolean;
  isMicOn: boolean;
}

type StreamCallback = (streams: Map<string, PeerMediaStream>) => void;

class SFUMediaManager {
  private livekitRoom: Room | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, PeerMediaStream> = new Map();
  private makingOffer: Map<string, boolean> = new Map();
  private politeness: Map<string, boolean> = new Map();
  private listeners: Set<StreamCallback> = new Set();
  private socketSend: ((msg: any) => void) | null = null;
  private currentUserId: string = '';
  private currentSeatNumber: number | null = null;

  public initSocket(sendFn: (msg: any) => void, userId: string) {
    this.socketSend = sendFn;
    this.currentUserId = userId;
  }

  public subscribeStreams(callback: StreamCallback) {
    this.listeners.add(callback);
    callback(new Map(this.remoteStreams));
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const copy = new Map(this.remoteStreams);
    this.listeners.forEach((cb) => cb(copy));
  }

  public getLocalMediaStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Acquire local camera and microphone stream
   */
  public async getLocalStream(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
      }
      if (!video && !audio) {
        this.localStream = null;
        return null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24 } } : false,
        audio: audio,
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('Failed to access camera/mic media device:', err);
      return null;
    }
  }

  /**
   * Called when user takes a seat -> Become Publisher
   */
  public async publishSeatMedia(seatNumber: number, slotType: 'video' | 'audio' = 'video'): Promise<MediaStream | null> {
    this.currentSeatNumber = seatNumber;
    const isVideo = slotType === 'video';
    const stream = await this.getLocalStream(isVideo, true);

    // 1. Try LiveKit Cloud publish if LiveKit Room is active
    if (this.livekitRoom && this.livekitRoom.state === 'connected') {
      try {
        if (stream) {
          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];
          if (videoTrack) await this.livekitRoom.localParticipant.publishTrack(videoTrack);
          if (audioTrack) await this.livekitRoom.localParticipant.publishTrack(audioTrack);
        }
      } catch (e) {
        console.warn('LiveKit track publish note:', e);
      }
    }

    // 2. WebRTC PeerMesh Signaling to all connected viewers in the room
    if (this.socketSend && stream) {
      this.socketSend({
        type: 'rtc-signal',
        signalType: 'announce-publisher',
        seatNumber,
        userId: this.currentUserId,
        hasVideo: isVideo,
        hasAudio: true,
      });
    }

    return stream;
  }

  /**
   * Called when user leaves a seat -> Stop Publisher
   */
  public unpublishSeatMedia() {
    this.currentSeatNumber = null;
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Unpublish from LiveKit if connected
    if (this.livekitRoom && this.livekitRoom.state === 'connected') {
      try {
        this.livekitRoom.localParticipant.trackPublications.forEach((publication) => {
          if (publication.track) {
            this.livekitRoom?.localParticipant.unpublishTrack(publication.track);
          }
        });
      } catch (e) {
        console.warn('LiveKit unpublish error:', e);
      }
    }

    // Close peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.makingOffer.clear();
    this.politeness.clear();

    if (this.socketSend) {
      this.socketSend({
        type: 'rtc-signal',
        signalType: 'unpublish-publisher',
        userId: this.currentUserId,
      });
    }
  }

  /**
   * Toggle Mic / Host Mute
   */
  public setMicEnabled(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle Video
   */
  public setVideoEnabled(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Called whenever stage guests list updates or viewer enters room.
   * Checks if there are stage publishers we aren't connected to yet, and requests their streams.
   */
  public syncStageGuests(guests: any[], localUserId: string) {
    if (!this.socketSend) return;

    guests.forEach((guest) => {
      if (guest.user?.id && guest.user.id !== localUserId) {
        const existingPc = this.peerConnections.get(guest.user.id);
        const existingStream = this.remoteStreams.get(guest.user.id);

        if (!existingPc || !existingStream) {
          this.socketSend!({
            type: 'rtc-signal',
            signalType: 'request-stream',
            targetUserId: guest.user.id,
            seatNumber: guest.seatNumber,
          });
        }
      }
    });
  }

  /**
   * Handle WebRTC P2P/SFU offer/answer/candidate messages received via WebSocket
   */
  public async handleRtcSignal(data: any) {
    const { signalType, fromUserId, seatNumber, offer, answer, candidate } = data;

    if (fromUserId === this.currentUserId) return;

    if (signalType === 'request-stream') {
      // Remote viewer (fromUserId) requested our publisher stream!
      if (this.socketSend && (this.localStream || this.currentSeatNumber !== null)) {
        this.socketSend({
          type: 'rtc-signal',
          signalType: 'announce-publisher',
          targetUserId: fromUserId,
          seatNumber: this.currentSeatNumber || seatNumber || 1,
          userId: this.currentUserId,
          hasVideo: this.localStream ? this.localStream.getVideoTracks().length > 0 : true,
          hasAudio: this.localStream ? this.localStream.getAudioTracks().length > 0 : true,
        });
      }
    } else if (signalType === 'announce-publisher') {
      // Create WebRTC PeerConnection as subscriber to receive publisher stream
      await this.createPeerConnection(fromUserId, seatNumber, true);
    } else if (signalType === 'offer') {
      let pc = this.peerConnections.get(fromUserId);
      if (!pc) {
        pc = await this.createPeerConnection(fromUserId, seatNumber, false);
      }

      const polite = this.politeness.get(fromUserId) ?? (this.currentUserId < fromUserId);
      const offerCollision = (this.makingOffer.get(fromUserId) || false) || pc.signalingState !== 'stable';
      const ignoreOffer = !polite && offerCollision;

      if (ignoreOffer) {
        return; // Impolite peer ignores incoming offer collision
      }

      if (offerCollision) {
        try {
          await pc.setLocalDescription({ type: 'rollback' } as any);
        } catch (e) {
          console.warn('Rollback notice:', e);
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const newAnswer = await pc.createAnswer();
      await pc.setLocalDescription(newAnswer);

      if (this.socketSend) {
        this.socketSend({
          type: 'rtc-signal',
          signalType: 'answer',
          targetUserId: fromUserId,
          answer: newAnswer,
        });
      }
    } else if (signalType === 'answer') {
      const pc = this.peerConnections.get(fromUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } else if (signalType === 'candidate') {
      const pc = this.peerConnections.get(fromUserId);
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } else if (signalType === 'unpublish-publisher') {
      const pc = this.peerConnections.get(fromUserId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(fromUserId);
      }
      this.makingOffer.delete(fromUserId);
      this.politeness.delete(fromUserId);
      this.remoteStreams.delete(fromUserId);
      this.notifyListeners();
    }
  }

  private async createPeerConnection(remoteUserId: string, seatNumber: number, isInitiator: boolean): Promise<RTCPeerConnection> {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.services.mozilla.com' },
      ],
      iceCandidatePoolSize: 10,
    };

    const isPolite = this.currentUserId < remoteUserId;
    this.politeness.set(remoteUserId, isPolite);

    const pc = new RTCPeerConnection(config);
    this.peerConnections.set(remoteUserId, pc);

    // If local user is on stage, attach local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    } else {
      // If viewer (no local stream), add receive-only transceivers so SDP offer/answer negotiates incoming video & audio
      try {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
      } catch (e) {
        console.warn('Transceiver setup note:', e);
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && this.socketSend) {
        this.socketSend({
          type: 'rtc-signal',
          signalType: 'candidate',
          targetUserId: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const existingEntry = this.remoteStreams.get(remoteUserId);
      const remoteStream = existingEntry?.stream || event.streams[0] || new MediaStream();

      if (!remoteStream.getTracks().includes(event.track)) {
        remoteStream.addTrack(event.track);
      }

      this.remoteStreams.set(remoteUserId, {
        userId: remoteUserId,
        seatNumber,
        stream: remoteStream,
        isVideoOn: remoteStream.getVideoTracks().length > 0,
        isMicOn: remoteStream.getAudioTracks().length > 0,
      });
      this.notifyListeners();
    };

    if (isInitiator) {
      try {
        this.makingOffer.set(remoteUserId, true);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (this.socketSend) {
          this.socketSend({
            type: 'rtc-signal',
            signalType: 'offer',
            targetUserId: remoteUserId,
            seatNumber: this.currentSeatNumber,
            offer,
          });
        }
      } catch (err) {
        console.warn('Offer error:', err);
      } finally {
        this.makingOffer.set(remoteUserId, false);
      }
    }

    return pc;
  }

  /**
   * Connect LiveKit Room if LiveKit token is provided by server
   */
  public async connectLiveKit(livekitUrl: string, token: string) {
    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
          const mediaStream = new MediaStream([track.mediaStreamTrack]);
          this.remoteStreams.set(participant.identity, {
            userId: participant.identity,
            seatNumber: 1,
            stream: mediaStream,
            isVideoOn: track.kind === Track.Kind.Video,
            isMicOn: track.kind === Track.Kind.Audio,
          });
          this.notifyListeners();
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (_track, _publication, participant) => {
        this.remoteStreams.delete(participant.identity);
        this.notifyListeners();
      });

      await room.connect(livekitUrl, token);
      this.livekitRoom = room;
    } catch (e) {
      console.warn('LiveKit cloud connection notice:', e);
    }
  }
}

export const sfuManager = new SFUMediaManager();
