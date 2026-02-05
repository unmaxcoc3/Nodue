
import { createClient } from '@supabase/supabase-js';

// UPDATED SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://atyzqajxedytyunhmujd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eXpxYWp4ZWR5dHl1bmhtdWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MjczMjUsImV4cCI6MjA4NTAwMzMyNX0.5VF52z70qAyshOvpyY2Cg2FeVHO0NJZX_dQWhBdigAA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Syncs specific application data to Supabase tables.
 * Fixed: Now deletes old records before inserting new state to handle removals (like holidays).
 */
export const syncWithSupabase = async (userEmail: string, data: any, type: 'profile' | 'attendance' | 'day_attendance' | 'timetable') => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    if (type === 'profile') {
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: data.name,
        institution_name: data.institutionName,
        semester: data.semester,
        attendance_goal: data.attendanceGoal,
        use_advanced_mode: data.useAdvancedMode,
        email: data.email,
        updated_at: new Date().toISOString()
      });
    } else if (type === 'timetable') {
      // Clear and re-insert to handle deletions
      await supabase.from('timetable').delete().eq('user_id', user.id);
      const slotsToInsert = data.map((slot: any) => ({
        user_id: user.id,
        subject_name: slot.subjectName,
        day: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime,
        faculty: slot.faculty,
        color: slot.color
      }));
      if (slotsToInsert.length > 0) {
        await supabase.from('timetable').insert(slotsToInsert);
      }
    } else if (type === 'attendance') {
      // FIX: Delete existing records first to ensure removed items stay removed
      await supabase.from('attendance').delete().eq('user_id', user.id);
      const recordsToInsert = data.map((rec: any) => ({
        user_id: user.id,
        date: rec.date,
        subject_id: rec.subjectId,
        subject_name: rec.subjectName,
        status: rec.status,
        slot_id: rec.slotId
      }));
      if (recordsToInsert.length > 0) {
        await supabase.from('attendance').insert(recordsToInsert);
      }
    } else if (type === 'day_attendance') {
      // FIX: Delete existing records first to ensure removed holidays stay removed
      await supabase.from('day_attendance').delete().eq('user_id', user.id);
      const dayRecords = data.map((rec: any) => ({
        user_id: user.id,
        date: rec.date,
        status: rec.status
      }));
      if (dayRecords.length > 0) {
        await supabase.from('day_attendance').insert(dayRecords);
      }
    }
  } catch (err) {
    console.error(`[Supabase Sync Error] Failed to sync ${type}:`, err);
  }
};
