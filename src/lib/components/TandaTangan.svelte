<script lang="ts">
	import { onMount } from 'svelte'

	let canvas: HTMLCanvasElement
	let ctx: CanvasRenderingContext2D | null = null
	let isDrawing = false
	let hasSignature = $state(false)

	let { signatureData = $bindable(''), width = 400, height = 200, disabled = false } = $props()

	onMount(() => {
		const c = canvas
		if (!c) return
		ctx = c.getContext('2d')
		if (!ctx) return

		// Set canvas size
		c.width = width
		c.height = height

		// Set drawing style
		ctx.strokeStyle = '#1e293b'
		ctx.lineWidth = 2
		ctx.lineCap = 'round'
		ctx.lineJoin = 'round'
	})

	function startDrawing(e: MouseEvent | TouchEvent) {
		if (disabled) return
		isDrawing = true
		const pos = getPosition(e)
		if (!ctx || !pos) return
		ctx.beginPath()
		ctx.moveTo(pos.x, pos.y)
	}

	function draw(e: MouseEvent | TouchEvent) {
		if (!isDrawing || disabled || !ctx) return
		const pos = getPosition(e)
		if (!pos) return
		ctx.lineTo(pos.x, pos.y)
		ctx.stroke()
		hasSignature = true
	}

	function stopDrawing() {
		if (!isDrawing) return
		isDrawing = false
		if (hasSignature && canvas) {
			signatureData = canvas.toDataURL('image/png')
		}
	}

	function getPosition(e: MouseEvent | TouchEvent): { x: number; y: number } | null {
		if (!canvas) return null
		const rect = canvas.getBoundingClientRect()
		if (e instanceof MouseEvent) {
			return { x: e.clientX - rect.left, y: e.clientY - rect.top }
		} else if (e instanceof TouchEvent && e.touches.length > 0) {
			return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
		}
		return null
	}

	function clear() {
		if (!ctx || !canvas) return
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		hasSignature = false
		signatureData = ''
	}

	export function clearSignature() {
		clear()
	}
</script>

<div class="signature-container">
	<canvas
		bind:this={canvas}
		class="signature-canvas"
		class:disabled
		onmousedown={startDrawing}
		onmousemove={draw}
		onmouseup={stopDrawing}
		onmouseleave={stopDrawing}
		ontouchstart={(e) => { e.preventDefault(); startDrawing(e) }}
		ontouchmove={(e) => { e.preventDefault(); draw(e) }}
		ontouchend={(e) => { e.preventDefault(); stopDrawing() }}
	></canvas>
	{#if !disabled}
		<button type="button" class="btn-clear" onclick={clear} disabled={!hasSignature}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
			Hapus
		</button>
	{/if}
</div>

<style>
	.signature-container {
		position: relative;
		display: inline-block;
	}
	.signature-canvas {
		border: 1.5px dashed #cbd5e1;
		border-radius: 10px;
		background: #fafafa;
		cursor: crosshair;
		display: block;
		touch-action: none;
	}
	.signature-canvas.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
	.btn-clear {
		position: absolute;
		top: 8px;
		right: 8px;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.35rem 0.65rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.btn-clear:hover:not(:disabled) {
		background: #dc2626;
	}
	.btn-clear:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.btn-clear svg {
		width: 14px;
		height: 14px;
	}
</style>
