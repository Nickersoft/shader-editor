
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/r" | "/r/shader-mount";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/r": Record<string, never>;
			"/r/shader-mount": Record<string, never>
		};
		Pathname(): "/" | "/r/shader-mount";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/apple-icon.png" | "/heatmap-test.webp" | "/icon-dark-32x32.png" | "/icon-light-32x32.png" | "/icon.svg" | "/placeholder-logo.png" | "/placeholder-logo.svg" | "/placeholder-user.jpg" | "/placeholder.jpg" | "/placeholder.svg" | "/refs/shaders-com/angularblur.png" | "/refs/shaders-com/ascii.png" | "/refs/shaders-com/aurora.png" | "/refs/shaders-com/beam.png" | "/refs/shaders-com/blob.png" | "/refs/shaders-com/blur.png" | "/refs/shaders-com/brightnesscontrast.png" | "/refs/shaders-com/bulge.png" | "/refs/shaders-com/channelblur.png" | "/refs/shaders-com/checkerboard.png" | "/refs/shaders-com/chromaflow.png" | "/refs/shaders-com/chromaticaberration.png" | "/refs/shaders-com/concentricspin.png" | "/refs/shaders-com/conicgradient.png" | "/refs/shaders-com/contourlines.png" | "/refs/shaders-com/crtscreen.png" | "/refs/shaders-com/crystal.png" | "/refs/shaders-com/cursorripples.png" | "/refs/shaders-com/cursortrail.png" | "/refs/shaders-com/diamondgradient.png" | "/refs/shaders-com/diffuseblur.png" | "/refs/shaders-com/dither.png" | "/refs/shaders-com/domtexture.png" | "/refs/shaders-com/dotgrid.png" | "/refs/shaders-com/dropshadow.png" | "/refs/shaders-com/duotone.png" | "/refs/shaders-com/emboss.png" | "/refs/shaders-com/fallinglines.png" | "/refs/shaders-com/filmgrain.png" | "/refs/shaders-com/floatingparticles.png" | "/refs/shaders-com/flowfield.png" | "/refs/shaders-com/flowinggradient.png" | "/refs/shaders-com/flutedglass.png" | "/refs/shaders-com/fog.png" | "/refs/shaders-com/form3d.png" | "/refs/shaders-com/glass.png" | "/refs/shaders-com/glasstiles.png" | "/refs/shaders-com/glitch.png" | "/refs/shaders-com/glow.png" | "/refs/shaders-com/godrays.png" | "/refs/shaders-com/grayscale.png" | "/refs/shaders-com/grid.png" | "/refs/shaders-com/griddistortion.png" | "/refs/shaders-com/halftone.png" | "/refs/shaders-com/hexgrid.png" | "/refs/shaders-com/hueshift.png" | "/refs/shaders-com/imagetexture.png" | "/refs/shaders-com/invert.png" | "/refs/shaders-com/kaleidoscope.png" | "/refs/shaders-com/lensflare.png" | "/refs/shaders-com/linearblur.png" | "/refs/shaders-com/lineargradient.png" | "/refs/shaders-com/liquify.png" | "/refs/shaders-com/mirror.png" | "/refs/shaders-com/multipointgradient.png" | "/refs/shaders-com/neon.png" | "/refs/shaders-com/paper.png" | "/refs/shaders-com/perspective.png" | "/refs/shaders-com/pixelate.png" | "/refs/shaders-com/plasma.png" | "/refs/shaders-com/polarcoordinates.png" | "/refs/shaders-com/posterize.png" | "/refs/shaders-com/progressiveblur.png" | "/refs/shaders-com/radialgradient.png" | "/refs/shaders-com/rectangularcoordinates.png" | "/refs/shaders-com/ripples.png" | "/refs/shaders-com/saturation.png" | "/refs/shaders-com/sharpness.png" | "/refs/shaders-com/shatter.png" | "/refs/shaders-com/simplexnoise.png" | "/refs/shaders-com/sinewave.png" | "/refs/shaders-com/smoke.png" | "/refs/shaders-com/smokefill.png" | "/refs/shaders-com/solarize.png" | "/refs/shaders-com/solidcolor.png" | "/refs/shaders-com/spherize.png" | "/refs/shaders-com/spiral.png" | "/refs/shaders-com/strands.png" | "/refs/shaders-com/stretch.png" | "/refs/shaders-com/stripes.png" | "/refs/shaders-com/studiobackground.png" | "/refs/shaders-com/swirl.png" | "/refs/shaders-com/tiltshift.png" | "/refs/shaders-com/tint.png" | "/refs/shaders-com/tritone.png" | "/refs/shaders-com/truchet.png" | "/refs/shaders-com/twirl.png" | "/refs/shaders-com/vhs.png" | "/refs/shaders-com/vibrance.png" | "/refs/shaders-com/videotexture.png" | "/refs/shaders-com/vignette.png" | "/refs/shaders-com/voronoi.png" | "/refs/shaders-com/wavedistortion.png" | "/refs/shaders-com/weave.png" | "/refs/shaders-com/webcamtexture.png" | "/refs/shaders-com/zoomblur.png" | string & {};
	}
}