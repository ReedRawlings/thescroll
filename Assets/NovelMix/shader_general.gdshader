shader_type canvas_item;

uniform bool pixelated = true;

group_uniforms wave;
uniform vec2 wave_intensity = vec2(0,0);
uniform vec2 wave_speed = vec2(1,1);
uniform vec2 wave_size = vec2(5,5);
group_uniforms scanline;
uniform vec4 scanline_color:source_color = vec4(1.0,1.0,1.0,0.0);
uniform float scanline_size: hint_range(0.4, 5.0,0.01) = 1.0;
uniform float scanline_speed: hint_range(-1.0, 1.0,0.01) = 0.0;
group_uniforms gradient;
uniform float gradient_amount: hint_range(0.0, 1.0,0.01) = 0.0;
uniform sampler2D gradient;
uniform float gradient_speed: hint_range(-0.0, 3.0,0.01) = 0.0;
group_uniforms shake;
uniform float shake_intensity = 0.0;

varying vec4 modulate;


float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

void vertex() {
    if (shake_intensity > 0.0) {
        float time = TIME * 30.0;
        vec2 random_offset = vec2(
            rand(vec2(time, 0.0)) * 2.0 - 1.0,
            rand(vec2(time, 10.0)) * 2.0 - 1.0
        );
        VERTEX += random_offset * shake_intensity;
    }
	modulate = COLOR;
}


void fragment(){
	vec2 uv = UV;
	
	// --- PIXELATED ---
	if (pixelated){
		uv = (round((uv/TEXTURE_PIXEL_SIZE))+0.5)*(TEXTURE_PIXEL_SIZE);
	}
	// --- WAVE ---
	uv.x += sin((uv.y*wave_size.x)+(TIME*wave_speed.x))*(wave_intensity.x*0.1);
	uv.y += sin((uv.x*wave_size.y)+(TIME*wave_speed.y))*(wave_intensity.y*0.1);
	
	vec4 base_color = texture(TEXTURE, uv);
	
	// --- GRADIENT ---
	base_color *= modulate;
	vec4 color = base_color;
	float grey = (base_color.r + base_color.g + base_color.b) / 3.0;
	grey += sin(TIME*gradient_speed*5.0)*0.1;
	vec4 gradient_color = texture(gradient, vec2(grey, 0.5));
	color.rgb = mix(color.rgb,gradient_color.rgb,gradient_amount);
	color.a *= gradient_color.a;
	
	// --- SCAN LINE ---
	float scan_speed = scanline_speed*scanline_size;
	float pixel_y = round(((UV.y+(scan_speed*TIME))/(scanline_size)) / TEXTURE_PIXEL_SIZE.y);
	float line = mod(pixel_y, 2.0);
	color.rgb = mix(color.rgb,scanline_color.rgb,line*scanline_color.a);
	
	// --- APPLY ---
	COLOR = color;
}