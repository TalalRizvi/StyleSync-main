// GET /api/brands/:brandId/garments - List all garments for a brand

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { request: Request; env: Env; params: { brandId: string } }) {
  const { env, params } = context;
  const { brandId } = params;

  try {
    // Query garments from D1 database
    const result = await env.DB.prepare(
      'SELECT * FROM garments WHERE brand_id = ? AND active = 1 ORDER BY created_at DESC'
    ).bind(brandId).all();

    return new Response(JSON.stringify({
      success: true,
      garments: result.results
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch garments'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/brands/:brandId/garments - Add new garment
export async function onRequestPost(context: { request: Request; env: Env; params: { brandId: string } }) {
  const { request, env, params } = context;
  const { brandId } = params;

  try {
    const garment = await request.json() as any;
    
    const id = 'gmt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    await env.DB.prepare(
      'INSERT INTO garments (id, brand_id, name, type, category, color, description, image_url, back_image_url, side_image_url, price, currency, size_chart, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
    ).bind(
      id,
      brandId,
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
      JSON.stringify(garment.sizeChart)
    ).run();

    return new Response(JSON.stringify({
      success: true,
      garment: { id, ...garment }
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create garment'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
