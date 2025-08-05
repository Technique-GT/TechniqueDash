import {
  IconBarrierBlock,
  IconBrowserCheck,
  IconBug,
  IconChecklist,
  IconError404,
  IconHelp,
  IconLayoutDashboard,
  IconLock,
  IconLockAccess,
  IconMessages,
  IconNotification,
  IconPackages,
  IconPalette,
  IconServerOff,
  IconSettings,
  IconTool,
  IconUserCog,
  IconUserOff,
  IconUsers,
} from '@tabler/icons-react'
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'John Doe',
    email: 'johndoe@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'News Team',
      logo: Command,
      plan: 'Basic',
    },
    {
      name: 'Sports Team',
      logo: GalleryVerticalEnd,
      plan: 'Pro',
    },
    {
      name: 'Opinion Team',
      logo: AudioWaveform,
      plan: 'Pro',
    },
  ],
  navGroups: [
    {
      title: 'Core',
      items: [
        {
          title: 'Dashboard',
          url: '/dash',
          icon: IconLayoutDashboard,
        },
        {
          title: 'Article Tasks',
          url: '/tasks',
          icon: IconChecklist,
        },
        {
          title: 'Media Library',
          url: '/apps',
          icon: IconPackages,
        },
        {
          title: 'Editor Comments',
          url: '/chats',
          badge: '3',
          icon: IconMessages,
        },
        {
          title: 'Staff Members',
          url: '/users',
          icon: IconUsers,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          title: 'Content',
          icon: IconLockAccess,
          items: [
            {
              title: 'Analytics',
              url: '/sign-in',
            },
            {
              title: 'Media Gallery',
              url: '/sign-in-2',
            },
            {
              title: 'Contributors',
              url: '/sign-up',
            },
            {
              title: 'Editorial Board',
              url: '/forgot-password',
            },
            {
              title: 'Verification',
              url: '/otp',
            },
          ],
        },
        {
          title: 'Errors',
          icon: IconBug,
          items: [
            {
              title: 'Unauthorized',
              url: '/401',
              icon: IconLock,
            },
            {
              title: 'Forbidden',
              url: '/403',
              icon: IconUserOff,
            },
            {
              title: 'Not Found',
              url: '/404',
              icon: IconError404,
            },
            {
              title: 'Internal Server Error',
              url: '/500',
              icon: IconServerOff,
            },
            {
              title: 'Maintenance Error',
              url: '/503',
              icon: IconBarrierBlock,
            },
          ],
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Settings',
          icon: IconSettings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: IconHelp,
        },
      ],
    },
  ],
}