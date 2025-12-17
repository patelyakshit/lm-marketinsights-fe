/**
 * Marketing Posts Store
 * Manages marketing post state using Zustand
 */

import { create } from "zustand";
import { MarketingPost } from "../ui-new/components/layout/StudioView";

interface MarketingStore {
  // Posts
  posts: MarketingPost[];

  // Loading state for image generation
  isGenerating: boolean;
  generatingMessage: string | null;

  // Business info
  businessName: string | null;
  businessType: string | null;

  // Actions
  addPost: (post: MarketingPost) => void;
  addPosts: (posts: MarketingPost[]) => void;
  setPosts: (posts: MarketingPost[]) => void;
  updatePostImage: (postId: string, imageUrl: string) => void;
  removePost: (postId: string) => void;
  clearPosts: () => void;
  setBusinessInfo: (name: string, type?: string) => void;
  setGenerating: (isGenerating: boolean, message?: string) => void;

  // Start generation with placeholder posts (no images yet)
  startGeneration: (posts: MarketingPost[], businessName?: string, businessType?: string) => void;

  // Complete generation by updating posts with images
  completeGeneration: (posts: MarketingPost[]) => void;

  // Helper to add a post from backend response
  addPostFromResponse: (response: {
    platform: string;
    headline: string;
    caption: string;
    hashtags: string[];
    imageUrl?: string;
    segmentName?: string;
  }) => void;
}

export const useMarketingStore = create<MarketingStore>((set, get) => ({
  posts: [],
  isGenerating: false,
  generatingMessage: null,
  businessName: null,
  businessType: null,

  addPost: (post) =>
    set((state) => ({
      posts: [...state.posts, post],
    })),

  addPosts: (posts) =>
    set((state) => ({
      posts: [...state.posts, ...posts],
    })),

  setPosts: (posts) => set({ posts }),

  updatePostImage: (postId, imageUrl) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, imageUrl, isLoading: false } : p
      ),
    })),

  removePost: (postId) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId),
    })),

  clearPosts: () => set({ posts: [], isGenerating: false, generatingMessage: null }),

  setBusinessInfo: (name, type) =>
    set({
      businessName: name,
      businessType: type || null,
    }),

  setGenerating: (isGenerating, message) =>
    set({
      isGenerating,
      generatingMessage: message || null,
    }),

  // Start generation: clear old posts, set loading state, add placeholder posts
  startGeneration: (posts, businessName, businessType) =>
    set({
      posts: posts.map((p) => ({ ...p, isLoading: true })),
      isGenerating: true,
      generatingMessage: "Generating images...",
      businessName: businessName || null,
      businessType: businessType || null,
    }),

  // Complete generation: replace posts with final versions (with images)
  completeGeneration: (posts) =>
    set({
      posts: posts.map((p) => ({ ...p, isLoading: false })),
      isGenerating: false,
      generatingMessage: null,
    }),

  addPostFromResponse: (response) => {
    const { businessName } = get();
    const newPost: MarketingPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      platform: response.platform,
      headline: response.headline,
      caption: response.caption,
      hashtags: response.hashtags,
      imageUrl: response.imageUrl,
      businessName: businessName || undefined,
      segmentName: response.segmentName,
      createdAt: new Date(),
    };
    set((state) => ({
      posts: [...state.posts, newPost],
    }));
  },
}));

export default useMarketingStore;
