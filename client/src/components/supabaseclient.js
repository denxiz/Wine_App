import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://your-project-id.supabase.co";
const supabaseKey = "your-anon-or-service-role-key";

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
