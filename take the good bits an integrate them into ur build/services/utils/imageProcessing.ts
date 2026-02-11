
export const removeWhiteBackground = async (base64Input: string, tolerance: number = 60): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Ensure input has data URI prefix
        const src = base64Input.startsWith('data:') ? base64Input : `data:image/png;base64,${base64Input}`;
        
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = src;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                console.warn("Could not get canvas context for background removal.");
                resolve(src);
                return;
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;

            // 1. Determine dominant background color from ALL corners to handle gradients/artifacts
            const corners = [
                0,                                  // Top-Left
                (width - 1) * 4,                    // Top-Right
                (height - 1) * width * 4,           // Bottom-Left
                ((height - 1) * width + width - 1) * 4 // Bottom-Right
            ];

            // Default to White if we can't decide, since we asked for white bg
            let bgR = 255, bgG = 255, bgB = 255;
            
            // Average the corners
            let rSum = 0, gSum = 0, bSum = 0;
            for (const idx of corners) {
                rSum += data[idx];
                gSum += data[idx + 1];
                bSum += data[idx + 2];
            }
            bgR = rSum / 4;
            bgG = gSum / 4;
            bgB = bSum / 4;

            // Helper: Check if pixel matches background within tolerance
            const isBackground = (r: number, g: number, b: number) => {
                return Math.abs(r - bgR) < tolerance && 
                       Math.abs(g - bgG) < tolerance && 
                       Math.abs(b - bgB) < tolerance;
            };

            // BFS Flood Fill
            const visited = new Uint8Array(width * height);
            const queue: number[] = [];
            let head = 0;

            const addSeed = (x: number, y: number) => {
                const idx = (y * width + x) * 4;
                if (isBackground(data[idx], data[idx + 1], data[idx + 2])) {
                    const pIdx = y * width + x;
                    if (!visited[pIdx]) {
                        visited[pIdx] = 1;
                        queue.push(pIdx);
                    }
                }
            };

            // Scan borders to find all background entry points
            for (let x = 0; x < width; x++) {
                addSeed(x, 0); // Top
                addSeed(x, height - 1); // Bottom
            }
            for (let y = 0; y < height; y++) {
                addSeed(0, y); // Left
                addSeed(width - 1, y); // Right
            }

            // Execute Flood Fill
            while (head < queue.length) {
                const currIdx = queue[head++];
                const cx = currIdx % width;
                const cy = Math.floor(currIdx / width);

                const pixelStart = currIdx * 4;
                data[pixelStart + 3] = 0; // Set Alpha to 0

                const neighbors = [
                    { x: cx, y: cy - 1 },
                    { x: cx, y: cy + 1 },
                    { x: cx - 1, y: cy },
                    { x: cx + 1, y: cy }
                ];

                for (const n of neighbors) {
                    if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                        const nIdx = n.y * width + n.x;
                        if (!visited[nIdx]) {
                            const pStart = nIdx * 4;
                            if (isBackground(data[pStart], data[pStart + 1], data[pStart + 2])) {
                                visited[nIdx] = 1;
                                queue.push(nIdx);
                            }
                        }
                    }
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = (e) => {
            console.error("Background removal failed to load image", e);
            resolve(src);
        };
    });
};
