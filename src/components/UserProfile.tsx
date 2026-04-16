'use client';

import { useState, useEffect } from 'react';
import { getMinecraftHead, extractMinecraftUsername } from '../lib/minecraft';

interface User {
  ai: number;
  last_name: string;
  email: string;
  locale: string;
  rank: string;
  balance: number;
  last_seen: string;
}

interface UserProfileProps {
  user: User;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function UserProfile({ user, showDetails = true, size = 'medium' }: UserProfileProps) {
  const [headUrl, setHeadUrl] = useState<string>('/steve-head.png');
  const [loading, setLoading] = useState(true);
  const [headExists, setHeadExists] = useState(false);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  useEffect(() => {
    const loadMinecraftHead = async () => {
      try {
        setLoading(true);
        const minecraftUsername = extractMinecraftUsername(user.last_name);
        const headData = await getMinecraftHead(minecraftUsername);
        setHeadUrl(headData.url);
        setHeadExists(headData.exists);
      } catch (error) {
        console.error('Error loading Minecraft head:', error);
        setHeadUrl('https://crafatar.com/avatars/Steve?size=64&default=MHF_Steve');
        setHeadExists(false);
      } finally {
        setLoading(false);
      }
    };

    loadMinecraftHead();
  }, [user.last_name]);

  const getRankColor = (rank: string) => {
    const rankLower = rank.toLowerCase();
    switch (rankLower) {
      case 'kurucu':
        return 'text-red-600 bg-red-100';
      case 'admin':
        return 'text-red-600 bg-red-100';
      case 'developer':
        return 'text-green-600 bg-green-100';
      case 'moderator':
        return 'text-blue-800 bg-blue-100';
      case 'mimar':
        return 'text-yellow-500 bg-yellow-100';
      case 'rehber':
        return 'text-blue-400 bg-blue-100';
      case 'oyuncu':
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getRankName = (rank: string) => {
    return rank || 'Oyuncu';
  };

  const getLocaleFlag = (locale: string) => {
    const flags: Record<string, string> = {
      'en-US': '🇺🇸',
      'tr-TR': '🇹🇷',
      'fr-FR': '🇫🇷',
      'de-DE': '🇩🇪',
      'zh-CN': '🇨🇳'
    };
    return flags[locale] || '🌍';
  };

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${size === 'large' ? 'p-4' : ''}`}>
      {/* Minecraft Head */}
      <div className="relative">
        <img
          src={headUrl}
          alt={`${user.last_name} head`}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 ${headExists ? 'border-green-400' : 'border-gray-300'} shadow-sm`}
          onError={(e) => {
            // Fallback to Steve head if image fails to load
            e.currentTarget.src = 'https://crafatar.com/avatars/Steve?size=64&default=MHF_Steve';
            setHeadExists(false);
          }}
        />
        {loading && (
          <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse absolute top-0 left-0`} />
        )}
        {!headExists && !loading && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" title="Default Steve head" />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h3 className={`font-semibold text-gray-900 ${textSizeClasses[size]}`}>
            {user.last_name}
          </h3>
          <span className="text-lg">{getLocaleFlag(user.locale)}</span>
        </div>
        
        {showDetails && (
          <div className={`text-gray-600 ${textSizeClasses[size]} opacity-75`}>
            {user.email}
          </div>
        )}
      </div>

      {/* Rank and Balance */}
      {showDetails && (
        <div className="text-right">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRankColor(user.rank)}`}>
            {getRankName(user.rank)}
          </div>
          <div className={`text-gray-900 font-medium ${textSizeClasses[size]}`}>
            ${user.balance.toFixed(2)}
          </div>
          <div className={`text-xs text-gray-500`}>
            {user.locale}
          </div>
        </div>
      )}
    </div>
  );
}
