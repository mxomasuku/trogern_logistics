// src/pages/auth/authSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { api } from "@/app/rtk";

// HIGHLIGHT: include role on User type
type User = {
  uid: string;
  email?: string | null;
  name?: string | null;
  role?: string | null; // HIGHLIGHT
} | null;

type MeResponse = { user: User };
type LoginResponse = { message: string; isSuccessful: boolean; user?: User };

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    me: build.query<MeResponse, void>({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Me"],
    }),

    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),

    // ============================================
    // REGISTER MUTATION
    // ============================================
    register: build.mutation<
      LoginResponse,
      {
        name: string;
        email: string;
        password: string;
        role?: string | null; // HIGHLIGHT: allow sending role on register
      }
    >({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Me"],
    }),
    // ============================================

    logout: build.mutation<{ message: string }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Me"],
    }),
  }),
});

const initialState = { userLoading: true };

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    unauthorized: (s) => s,
  },
  extraReducers: (b) => {
    b.addMatcher(authApi.endpoints.me.matchPending, (s) => {
      s.userLoading = true;
    });
    b.addMatcher(authApi.endpoints.me.matchFulfilled, (s) => {
      s.userLoading = false;
    });
    b.addMatcher(authApi.endpoints.me.matchRejected, (s) => {
      s.userLoading = false;
    });
  },
});

export default slice.reducer;

export const {
  useMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} = authApi;