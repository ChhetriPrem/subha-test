import React from 'react';
import { X, Bell } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#150a30] border border-purple-500/30 rounded-3xl p-5 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-base font-black text-white flex items-center space-x-2">
          <Bell className="w-5 h-5 text-pink-400" />
          <span>Notifications</span>
        </h2>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              No new notifications yet.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white/5 border border-white/10 hover:border-pink-500/30 p-3 rounded-2xl flex items-center space-x-3 transition-all"
              >
                <img
                  src={notif.user.avatar}
                  alt={notif.user.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-500/50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white">
                    <span className="font-bold text-pink-300">{notif.user.name}</span> {notif.text}
                  </p>
                  <span className="text-[10px] text-gray-400">{notif.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
