import { createClient } from '@supabase/supabase-js'
import { randomInt } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
  const { data, error } = await supabase
    .from('Test')              
    .insert([
      { 
        name: 'Rach'+randomInt(190),   
        }
    ])
console.log(await supabase
  .from('Test')
  .select('*'))

console.log(await supabase
  .from('Test')
  .select('*')
  .ilike('name', '%ali%') 
)
console.log(await supabase
  .from('Test')
  .select('*')
  .order('created_at', { ascending: false })
)

console.log(await supabase
  .from('Test')
  .select('*')
  .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
)


}

main()
