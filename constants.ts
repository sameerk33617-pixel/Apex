
import { AppData, Category } from './types';

export const CATEGORIES: Category[] = ["All", "Games", "Social", "Editors", "Tools", "Productivity", "Books"];

export const APPS: AppData[] = [
  {
    id: "1",
    name: "Free Fire Max",
    icon: "https://play-lh.googleusercontent.com/fA7mD8zM9Vp2xYI-H_p4zJ0p6vVjP1Z7H2Bv9Z6vV1=s256",
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    desc: "Experience the ultimate survival shooter on mobile with enhanced graphics and gameplay.",
    link: "https://play.google.com/store/apps/details?id=com.dts.freefiremax",
    cat: "Games",
    trending: true,
    rating: 4.8,
    downloads: "100M+",
    price: 0
  },
  {
    id: "2",
    name: "Minecraft",
    icon: "https://play-lh.googleusercontent.com/VSw_Z9_9A293z-S-pM9u0QyZ=s256",
    banner: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?q=80&w=1974&auto=format&fit=crop",
    desc: "Explore infinite worlds and build everything from the simplest of homes to the grandest of castles.",
    link: "https://play.google.com/store/apps/details?id=com.mojang.minecraftpe",
    cat: "Games",
    trending: true,
    rating: 4.6,
    downloads: "50M+",
    price: 6.99
  },
  {
    id: "3",
    name: "Adobe Lightroom",
    icon: "https://play-lh.googleusercontent.com/9v_p8yR6VzE=s256",
    banner: "https://images.unsplash.com/photo-1554080353-a576cf803bda?q=80&w=1974&auto=format&fit=crop",
    desc: "Create beautiful photos with the world's most powerful photo editing app.",
    link: "https://play.google.com/store/apps/details?id=com.adobe.lrmobile",
    cat: "Editors",
    trending: true,
    rating: 4.7,
    downloads: "100M+",
    price: 0
  },
  {
    id: "4",
    name: "Instagram",
    icon: "https://play-lh.googleusercontent.com/VRMWkJ6Q1c9Q.png",
    banner: "https://images.unsplash.com/photo-1611267254323-4db7b39c732c?q=80&w=2024&auto=format&fit=crop",
    desc: "Share what's new and see what's happening with friends and the world.",
    link: "https://play.google.com/store/apps/details?id=com.instagram.android",
    cat: "Social",
    trending: false,
    rating: 4.5,
    downloads: "5B+",
    price: 0
  },
  {
    id: "b1",
    name: "Atomic Habits",
    icon: "https://images-na.ssl-images-amazon.com/images/I/91bYsX41DVL.jpg",
    banner: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1974&auto=format&fit=crop",
    desc: "The #1 New York Times bestseller. Tiny Changes, Remarkable Results.",
    link: "https://www.google.com/search?q=Atomic+Habits+Book",
    cat: "Books",
    trending: true,
    rating: 4.9,
    downloads: "1M+",
    price: 12.99
  },
  {
    id: "t1",
    name: "Spotify Premium",
    icon: "https://play-lh.googleusercontent.com/UrYjBmi-5Y-S-K=s256",
    banner: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1974&auto=format&fit=crop",
    desc: "Listen to millions of songs and podcasts without ads.",
    link: "https://play.google.com/store/apps/details?id=com.spotify.music",
    cat: "Tools",
    trending: true,
    rating: 4.7,
    downloads: "1B+",
    price: 0
  }
];
