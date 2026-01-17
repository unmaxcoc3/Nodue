
// Simulated Supabase client for email/password authentication
export const supabase = {
  auth: {
    signIn: async (email: string, pass: string) => {
      console.log(`[Supabase] Signing in with ${email}`);
      await new Promise(r => setTimeout(r, 1000));
      return { 
        data: { 
          user: { email, id: 'mock-uuid-123' },
          session: { access_token: 'mock-token' }
        }, 
        error: null 
      };
    },
    signUp: async (email: string, pass: string) => {
      console.log(`[Supabase] Creating account for ${email}`);
      await new Promise(r => setTimeout(r, 1200));
      return { 
        data: { 
          user: { email, id: 'mock-uuid-123' } 
        }, 
        error: null 
      };
    },
    signOut: async () => {
      console.log("Signing out from Supabase...");
      return { error: null };
    }
  },
  from: (table: string) => ({
    upsert: async (data: any) => {
      console.log(`[Supabase] Upserting to ${table}:`, data);
      return { error: null };
    },
    select: async () => {
      return { data: [], error: null };
    },
    delete: function() { return this; },
    eq: function() { return this; }
  })
};

export const syncWithSupabase = async (userEmail: string, data: any, table: string) => {
  if (!userEmail) return;
  try {
    await supabase.from(table).upsert({
      email: userEmail,
      content: JSON.stringify(data),
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error(`Cloud sync failed for ${table}:`, err);
  }
};
