
import { createClient } from '@supabase/supabase-js';

// REAL SUPABASE CREDENTIALS PROVIDED
const SUPABASE_URL = 'https://iuhgrqubwsvuzrupeqbr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_74z8jQ7xagPYP0IyAuWcWA_wbADSUN7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Syncs specific application data to Supabase tables.
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
      const recordsToInsert = data.map((rec: any) => ({
        id: `${user.id}-${rec.id}`,
        user_id: user.id,
        date: rec.date,
        subject_id: rec.subjectId,
        subject_name: rec.subjectName,
        status: rec.status,
        slot_id: rec.slotId
      }));
      if (recordsToInsert.length > 0) {
        await supabase.from('attendance').upsert(recordsToInsert);
      }
    } else if (type === 'day_attendance') {
      const dayRecords = data.map((rec: any) => ({
        user_id: user.id,
        date: rec.date,
        status: rec.status
      }));
      if (dayRecords.length > 0) {
        await supabase.from('day_attendance').upsert(dayRecords);
      }
    }
  } catch (err) {
    console.error(`[Supabase Sync Error] Failed to sync ${type}:`, err);
  }
};
