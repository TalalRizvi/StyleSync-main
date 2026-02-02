// PUT /api/brands/:brandId/garments/:garmentId - Update garment
// DELETE /api/brands/:brandId/garments/:garmentId - Delete garment

interface Env {
  DB: D1Database;
}

export async function onRequestPut(context: { 
  request: Request; 
  env: Env; 
  params: { brandId: string; garmentId: string } 
}) {
  const { request, env, params } = context;
  const { brandId, garmentId } = params;

  try {
    const garment = await request.json() as any;
    
    await env.DB.prepare(
      'UPDATE garments SET name = ?, type = ?, category = ?, color = ?, description = ?, image_url = ?, back_image_url = ?, side_image_url = ?, price = ?, currency = ?, size_chart = ? WHERE id = ? AND brand_id = ?'
    ).bind(
      garment.name,
      garment.type,
      garment.bodyPlacement,
      garment.color,
      garment.description || null,
      garment.imageUrl,
      garment.backImageUrl || null,
      garment.sideImageUrl || null,
      garment.price || 0,
      garment.currency || 'USD',
      JSON.stringify(garment.sizeChart),
      garmentId,
      brandId
    ).run();

    return new Response(JSON.stringify({
      success: true,
      garment: { id: garmentId, ...garment }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update garment'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context: { 
  request: Request; 
  env: Env; 
  params: { brandId: string; garmentId: string } 
}) {
  const { env, params } = context;
  const { brandId, garmentId } = params;

  try {
    await env.DB.prepare(
      'DELETE FROM garments WHERE id = ? AND brand_id = ?'
    ).bind(garmentId, brandId).run();

    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete garment'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
