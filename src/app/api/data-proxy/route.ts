import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { action, table, data, query = {} } = await req.json();
    
    switch (action) {
      case 'select': {
        const { filters = {}, order = {}, limit, range } = query;
        let queryBuilder = supabase.from(table).select('*');
        
        // Apply filters
        if (Object.keys(filters).length > 0) {
          Object.entries(filters).forEach(([column, value]) => {
            queryBuilder = queryBuilder.eq(column, value);
          });
        }
        
        // Apply ordering
        if (Object.keys(order).length > 0) {
          const [[column, direction]] = Object.entries(order);
          queryBuilder = queryBuilder.order(column, { ascending: direction === 'asc' });
        }
        
        // Apply limit
        if (limit) {
          queryBuilder = queryBuilder.limit(limit);
        }
        
        // Apply range
        if (range && range.length === 2) {
          queryBuilder = queryBuilder.range(range[0], range[1]);
        }
        
        const { data: result, error } = await queryBuilder;
        
        if (error) throw error;
        return NextResponse.json(result);
      }
      
      case 'insert': {
        const { data: result, error } = await supabase.from(table).insert(data).select();
        
        if (error) throw error;
        return NextResponse.json(result);
      }
      
      case 'update': {
        const { id, ...updateData } = data;
        const { data: result, error } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', id)
          .select();
        
        if (error) throw error;
        return NextResponse.json(result);
      }
      
      case 'delete': {
        const { id } = data;
        const { data: result, error } = await supabase
          .from(table)
          .delete()
          .eq('id', id)
          .select();
        
        if (error) throw error;
        return NextResponse.json(result);
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Data proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
} 