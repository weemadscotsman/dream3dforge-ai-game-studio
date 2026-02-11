#!/bin/bash
echo "🔧 DREAM3DFORGE OPEN-SOURCE STACK INITIALIZER"

# Hardware Detection
if command -v nvidia-smi &> /dev/null
then
    VRAM=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -n 1)
    echo "Detected NVIDIA GPU with ${VRAM}MB VRAM"
else
    echo "No NVIDIA GPU detected. Falling back to CPU/DirectX mode."
    VRAM=0
fi

# Ollama Setup
if ! command -v ollama &> /dev/null
then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Model Selection
if [ "$VRAM" -gt 16000 ]; then
    MODEL="qwen2.5-coder:32b"
elif [ "$VRAM" -gt 8000 ]; then
    MODEL="llama3.2:11b"
else
    MODEL="phi3:mini"
fi

echo "Recommended Model: $MODEL"
ollama pull $MODEL

# Launch App
echo "Launching Dream3DForge..."
npm install
npm run dev
