-- Create the coffee_shops table
CREATE TABLE public.coffee_shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the menu_items table
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coffee_shop_id UUID NOT NULL REFERENCES public.coffee_shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the orders table (for each coffee run session)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coffee_shop_id UUID NOT NULL REFERENCES public.coffee_shops(id) ON DELETE CASCADE,
    share_code TEXT UNIQUE NOT NULL, -- Unique code for the shareable link
    status TEXT NOT NULL DEFAULT 'open', -- 'open' or 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create the order_selections table (individual participant choices)
CREATE TABLE public.order_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    participant_name TEXT, -- Optional: to identify who ordered what
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.coffee_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic for now, can be refined with authentication)
-- For coffee_shops: Anyone can read, only authenticated users can create/update/delete (if auth is added)
CREATE POLICY "Allow public read access to coffee_shops" ON public.coffee_shops FOR SELECT USING (TRUE);
-- For menu_items: Anyone can read, only owner can create/update/delete
CREATE POLICY "Allow public read access to menu_items" ON public.menu_items FOR SELECT USING (TRUE);
-- For orders: Anyone can read, only owner can create/update status
CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (TRUE);
-- For order_selections: Anyone can create/read, but only owner can delete/update (if auth is added)
CREATE POLICY "Allow public read and insert access to order_selections" ON public.order_selections FOR SELECT USING (TRUE);
CREATE POLICY "Allow public insert access to order_selections" ON public.order_selections FOR INSERT WITH CHECK (TRUE);
