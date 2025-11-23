-- Allow Marcomms to view and update template instances for review purposes
CREATE POLICY "Marcomms can view all instances"
ON public.template_instances
FOR SELECT
USING (has_role(auth.uid(), 'marcomms'::app_role));

CREATE POLICY "Marcomms can update instances"
ON public.template_instances
FOR UPDATE
USING (has_role(auth.uid(), 'marcomms'::app_role))
WITH CHECK (has_role(auth.uid(), 'marcomms'::app_role));

-- Allow Marcomms to view and update instance slides
CREATE POLICY "Marcomms can view instance slides"
ON public.slides
FOR SELECT
USING (
  has_role(auth.uid(), 'marcomms'::app_role)
  AND instance_id IS NOT NULL
);

CREATE POLICY "Marcomms can update instance slides"
ON public.slides
FOR UPDATE
USING (
  has_role(auth.uid(), 'marcomms'::app_role)
  AND instance_id IS NOT NULL
)
WITH CHECK (
  has_role(auth.uid(), 'marcomms'::app_role)
  AND instance_id IS NOT NULL
);

-- Allow Marcomms to view and update instance layers
CREATE POLICY "Marcomms can view instance layers"
ON public.layers
FOR SELECT
USING (
  has_role(auth.uid(), 'marcomms'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.slides
    WHERE slides.id = layers.slide_id
      AND slides.instance_id IS NOT NULL
  )
);

CREATE POLICY "Marcomms can update instance layers"
ON public.layers
FOR UPDATE
USING (
  has_role(auth.uid(), 'marcomms'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.slides
    WHERE slides.id = layers.slide_id
      AND slides.instance_id IS NOT NULL
  )
)
WITH CHECK (
  has_role(auth.uid(), 'marcomms'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.slides
    WHERE slides.id = layers.slide_id
      AND slides.instance_id IS NOT NULL
  )
);