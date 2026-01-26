// src/slices/usersApiSlice.js

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: 'POST',
        body: data,
      }),
    }),
    
    // ✅ Add this section for OTP handling
    sendOtp: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/send-otp`,
        method: 'POST',
        body: data,
      }),
    }),

    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}`, // POST /api/users
        method: 'POST',
        body: data,
      }),
    }),
    
    // ... other endpoints
  }),
});

// ✅ Ensure these are exported for use in your components
export const { 
  useLoginMutation, 
  useSendOtpMutation, // 👈 This is used in Register.jsx
  useRegisterMutation,
  // ...
} = usersApiSlice;