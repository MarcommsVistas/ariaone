-- Enable realtime for templates, slides, and layers tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.slides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.layers;