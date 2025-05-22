// Elementi DOM
const imageInput = document.getElementById('imageInput');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const brightness = document.getElementById('brightness');
const brightnessValue = document.getElementById('brightnessValue');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvasContainer = document.getElementById('canvasContainer');
const backgroundCanvas = document.getElementById('backgroundCanvas');
const drawingCanvas = document.getElementById('drawingCanvas');
const eraserBtn = document.getElementById('eraserBtn');
const penBtn = document.getElementById('penBtn');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const trasparentBackGround = document.getElementById("trasparentBackground");

// Contesti dei canvas
const bgCtx = backgroundCanvas.getContext('2d', { willReadFrequently: true });
const drawCtx = drawingCanvas.getContext('2d');

// Stato del disegno
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let originalImage = null;
let isEraser = false;
let panOffset = { x: 0, y: 0 };
let isPanning = false;
let lastPanPoint = { x: 0, y: 0 };

// Variabili per il supporto touch
let isTouchPanning = false;
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };

// Salva lo stile del pennello per passare tra penna e gomma
let penStyle = {
		color: '#000000',
		width: 5
};

// Inizializza i canvas fullscreen
function initCanvases() {
		resizeCanvases();
		
		// Inizializza il canvas di sfondo con bianco
		bgCtx.fillStyle = "white";
		bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
		
		// Stile del pennello iniziale
		drawCtx.strokeStyle = colorPicker.value;
		drawCtx.lineWidth = brushSize.value;
		drawCtx.lineCap = 'round';
		drawCtx.lineJoin = 'round';
}

// Ridimensiona i canvas per occupare tutto lo schermo
function resizeCanvases() {
		const width = window.innerWidth;
		const height = window.innerHeight;
		
		backgroundCanvas.width = width;
		backgroundCanvas.height = height;
		drawingCanvas.width = width;
		drawingCanvas.height = height;
		
		// Reimposta lo stile del pennello dopo il ridimensionamento
		drawCtx.strokeStyle = isEraser ? 'rgba(255,255,255,1)' : colorPicker.value;
		drawCtx.lineWidth = brushSize.value;
		drawCtx.lineCap = 'round';
		drawCtx.lineJoin = 'round';
}

// Carica e processa l'immagine
function loadImage(file) {
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = function(event) {
				const img = new Image();
				img.onload = function() {
						originalImage = img;
						panOffset = { x: 0, y: 0 };
						processImage();
				};
				img.src = event.target.result;
		};
		reader.readAsDataURL(file);
}

// Processa l'immagine (converte in grigio chiaro e centra)
function processImage() {
		if (!originalImage) return;

		const canvasWidth = backgroundCanvas.width;
		const canvasHeight = backgroundCanvas.height;
		
		// Pulisce il canvas
		bgCtx.fillStyle = "white";
		bgCtx.fillRect(0, 0, canvasWidth, canvasHeight);
		
		// Calcola le dimensioni per mantenere l'aspect ratio
		const imgAspect = originalImage.width / originalImage.height;
		const canvasAspect = canvasWidth / canvasHeight;
		
		let drawWidth, drawHeight, drawX, drawY;
		
		if (imgAspect > canvasAspect) {
				// L'immagine è più larga del canvas
				drawWidth = canvasWidth;
				drawHeight = canvasWidth / imgAspect;
				drawX = 0;
				drawY = (canvasHeight - drawHeight) / 2;
		} else {
				// L'immagine è più alta del canvas
				drawHeight = canvasHeight;
				drawWidth = canvasHeight * imgAspect;
				drawX = (canvasWidth - drawWidth) / 2;
				drawY = 0;
		}
		
		// Applica l'offset di pan
		drawX += panOffset.x;
		drawY += panOffset.y;
		
		// Disegna l'immagine originale prima di applicare il filtro
		bgCtx.drawImage(originalImage, drawX, drawY, drawWidth, drawHeight);
		
		// Applica il filtro solo dopo aver disegnato l'immagine
		applyGrayscaleFilter();
}

// Applica il filtro grigio chiaro all'immagine
function applyGrayscaleFilter() {
		if (!originalImage) return;
		
		const brightnessValue = brightness.value;
		const width = backgroundCanvas.width;
		const height = backgroundCanvas.height;
		
		try {
				// Ottieni i dati dell'immagine
				const imageData = bgCtx.getImageData(0, 0, width, height);
				const data = imageData.data;
				
				// Applica il filtro grigio chiaro e la luminosità
				for (let i = 0; i < data.length; i += 4) {
						// Salta i pixel completamente trasparenti (sfondo bianco)
						if (data[i + 3] === 0) continue;
						
						// Converte in scala di grigi
						const gray = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
						
						// Applica la luminosità (più alto = più chiaro)
						const lightnessFactor = brightnessValue / 100;
						const adjustedGray = gray + (255 - gray) * lightnessFactor;
						
						data[i] = adjustedGray;     // R
						data[i + 1] = adjustedGray; // G
						data[i + 2] = adjustedGray; // B
						// Alpha rimane invariato
				}
				
				bgCtx.putImageData(imageData, 0, 0);
		} catch (error) {
				console.error("Errore nell'applicazione del filtro:", error);
				// Se c'è un errore, ridisegna solo l'immagine senza filtro
				processImageWithoutFilter();
		}
}

// Funzione di fallback per ridisegnare l'immagine senza filtro
function processImageWithoutFilter() {
		if (!originalImage) return;

		const canvasWidth = backgroundCanvas.width;
		const canvasHeight = backgroundCanvas.height;
		
		// Pulisce il canvas
		bgCtx.fillStyle = "white";
		bgCtx.fillRect(0, 0, canvasWidth, canvasHeight);
		
		// Calcola le dimensioni per mantenere l'aspect ratio
		const imgAspect = originalImage.width / originalImage.height;
		const canvasAspect = canvasWidth / canvasHeight;
		
		let drawWidth, drawHeight, drawX, drawY;
		
		if (imgAspect > canvasAspect) {
				drawWidth = canvasWidth;
				drawHeight = canvasWidth / imgAspect;
				drawX = 0;
				drawY = (canvasHeight - drawHeight) / 2;
		} else {
				drawHeight = canvasHeight;
				drawWidth = canvasHeight * imgAspect;
				drawX = (canvasWidth - drawWidth) / 2;
				drawY = 0;
		}
		
		// Applica l'offset di pan
		drawX += panOffset.x;
		drawY += panOffset.y;
		
		bgCtx.drawImage(originalImage, drawX, drawY, drawWidth, drawHeight);
}

// Converti le coordinate in coordinate del canvas (funziona per mouse e touch)
function getCanvasCoordinates(clientX, clientY) {
		const rect = drawingCanvas.getBoundingClientRect();
		return {
				x: clientX - rect.left,
				y: clientY - rect.top
		};
}

// === FUNZIONI PER EVENTI MOUSE ===
function startDrawing(e) {
		// Tasto medio del mouse (rotella) per il panning
		if (e.button === 1) {
				e.preventDefault();
				isPanning = true;
				lastPanPoint = { x: e.clientX, y: e.clientY };
				drawingCanvas.style.cursor = 'grabbing';
				return;
		}
		
		// Solo tasto sinistro per disegnare
		if (e.button !== 0) return;
		
		isDrawing = true;
		const coords = getCanvasCoordinates(e.clientX, e.clientY);
		lastX = coords.x;
		lastY = coords.y;
		
		// Applica un punto all'inizio del tratto
		drawCtx.beginPath();
		drawCtx.arc(lastX, lastY, drawCtx.lineWidth / 2, 0, Math.PI * 2);
		
		if (isEraser) {
				drawCtx.globalCompositeOperation = 'destination-out';
				drawCtx.fill();
		} else {
				drawCtx.globalCompositeOperation = 'source-over';
				drawCtx.fill();
		}
}

function draw(e) {
		// Gestisci il panning
		if (isPanning && e.buttons & 4) {
				const dx = e.clientX - lastPanPoint.x;
				const dy = e.clientY - lastPanPoint.y;
				
				panOffset.x += dx;
				panOffset.y += dy;
				
				lastPanPoint = { x: e.clientX, y: e.clientY };
				
				processImage();
				return;
		}
		
		if (!isDrawing) return;
		
		const coords = getCanvasCoordinates(e.clientX, e.clientY);
		const x = coords.x;
		const y = coords.y;
		
		drawCtx.beginPath();
		drawCtx.moveTo(lastX, lastY);
		drawCtx.lineTo(x, y);
		
		if (isEraser) {
				drawCtx.globalCompositeOperation = 'destination-out';
		} else {
				drawCtx.globalCompositeOperation = 'source-over';
		}
		
		drawCtx.stroke();
		
		[lastX, lastY] = [x, y];
}

function stopDrawing(e) {
		if (isPanning) {
				isPanning = false;
				drawingCanvas.style.cursor = isEraser ? 'cell' : 'crosshair';
		}
		
		isDrawing = false;
}

// === FUNZIONI PER EVENTI TOUCH ===
function handleTouchStart(e) {
		e.preventDefault();
		const touch = e.touches[0];
		
		touchStartTime = Date.now();
		touchStartPos = { x: touch.clientX, y: touch.clientY };
		
		// Se ci sono due dita, inizia il panning
		if (e.touches.length === 2) {
				isTouchPanning = true;
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				lastPanPoint = { 
						x: (touch1.clientX + touch2.clientX) / 2,
						y: (touch1.clientY + touch2.clientY) / 2
				};
				return;
		}
		
		// Se è una sola dita, inizia a disegnare
		if (e.touches.length === 1) {
				isDrawing = true;
				const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
				lastX = coords.x;
				lastY = coords.y;
				
				// Applica un punto all'inizio del tratto
				drawCtx.beginPath();
				drawCtx.arc(lastX, lastY, drawCtx.lineWidth / 2, 0, Math.PI * 2);
				
				if (isEraser) {
						drawCtx.globalCompositeOperation = 'destination-out';
						drawCtx.fill();
				} else {
						drawCtx.globalCompositeOperation = 'source-over';
						drawCtx.fill();
				}
		}
}

function handleTouchMove(e) {
		e.preventDefault();
		
		// Gestisci il panning con due dita
		if (isTouchPanning && e.touches.length === 2) {
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				const currentPanPoint = { 
						x: (touch1.clientX + touch2.clientX) / 2,
						y: (touch1.clientY + touch2.clientY) / 2
				};
				
				const dx = currentPanPoint.x - lastPanPoint.x;
				const dy = currentPanPoint.y - lastPanPoint.y;
				
				panOffset.x += dx;
				panOffset.y += dy;
				
				lastPanPoint = currentPanPoint;
				
				if (originalImage) {
						processImage();
				}
				return;
		}
		
		// Gestisci il disegno con una sola dita
		if (!isDrawing || e.touches.length !== 1) return;
		
		const touch = e.touches[0];
		const coords = getCanvasCoordinates(touch.clientX, touch.clientY);
		const x = coords.x;
		const y = coords.y;
		
		drawCtx.beginPath();
		drawCtx.moveTo(lastX, lastY);
		drawCtx.lineTo(x, y);
		
		if (isEraser) {
				drawCtx.globalCompositeOperation = 'destination-out';
		} else {
				drawCtx.globalCompositeOperation = 'source-over';
		}
		
		drawCtx.stroke();
		
		[lastX, lastY] = [x, y];
}

function handleTouchEnd(e) {
		e.preventDefault();
		
		// Se era in modalità panning, fermalo
		if (isTouchPanning) {
				isTouchPanning = false;
		}
		
		// Se era in modalità disegno, fermalo
		if (isDrawing) {
				isDrawing = false;
		}
		
		// Gestisci il tocco lungo per aprire/chiudere la sidebar
		if (e.touches.length === 0) {
				const touchDuration = Date.now() - touchStartTime;
				const touch = e.changedTouches[0];
				const touchEndPos = { x: touch.clientX, y: touch.clientY };
				const touchDistance = Math.sqrt(
						Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
						Math.pow(touchEndPos.y - touchStartPos.y, 2)
				);
				
				// Se è un tocco lungo (>500ms) e senza movimento significativo (<20px)
				if (touchDuration > 500 && touchDistance < 20) {
						toggleSidebar();
				}
		}
}

// Attiva/disattiva la modalità gomma
function toggleEraser() {
		if (!isEraser) {
				isEraser = true;
				penStyle.color = drawCtx.strokeStyle;
				penStyle.width = drawCtx.lineWidth;
				
				drawCtx.strokeStyle = 'rgba(255,255,255,1)';
				drawCtx.lineWidth = brushSize.value;
				drawCtx.globalCompositeOperation = 'destination-out';
				
				eraserBtn.classList.add('active');
				penBtn.classList.remove('active');
				drawingCanvas.style.cursor = 'cell';
		}
}

// Attiva la modalità penna
function togglePen() {
		if (isEraser) {
				isEraser = false;
				
				drawCtx.strokeStyle = penStyle.color;
				drawCtx.lineWidth = brushSize.value;
				drawCtx.globalCompositeOperation = 'source-over';
				
				eraserBtn.classList.remove('active');
				penBtn.classList.add('active');
				drawingCanvas.style.cursor = 'crosshair';
		}
}

// Cancella il disegno
function clearDrawing() {
		drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

// Scarica solo il disegno 
function downloadImage() {
	try {
			let downloadCanvas;
			
			if (trasparentBackGround.checked) {
					// Scarica solo il disegno (canvas trasparente)
					downloadCanvas = drawingCanvas;
			} else {
					// Crea un canvas combinato con sfondo bianco
					downloadCanvas = document.createElement('canvas');
					downloadCanvas.width = drawingCanvas.width;
					downloadCanvas.height = drawingCanvas.height;
					const downloadCtx = downloadCanvas.getContext('2d');
					
					// Riempie con sfondo bianco
					downloadCtx.fillStyle = 'white';
					downloadCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
					
					// Sovrappone il disegno
					downloadCtx.drawImage(drawingCanvas, 0, 0);
			}
			
			const link = document.createElement('a');
			link.download = 'disegno.png';
			link.href = downloadCanvas.toDataURL('image/png');
			link.click();
	} catch (error) {
			console.error("Errore durante il download:", error);
			alert("Si è verificato un errore durante il salvataggio dell'immagine.");
	}
}

// Toggle sidebar
function toggleSidebar() {
		sidebar.classList.toggle('open');
}

// Event Listeners per controlli
imageInput.addEventListener('change', (e) => {
		if (e.target.files && e.target.files[0]) {
				loadImage(e.target.files[0]);
		}
});

colorPicker.addEventListener('change', () => {
		if (!isEraser) {
				drawCtx.strokeStyle = colorPicker.value;
				penStyle.color = colorPicker.value;
		}
});

brushSize.addEventListener('input', () => {
		drawCtx.lineWidth = brushSize.value;
		brushSizeValue.textContent = `${brushSize.value}px`;
		
		if (!isEraser) {
				penStyle.width = brushSize.value;
		}
});

brightness.addEventListener('input', () => {
		brightnessValue.textContent = `${brightness.value}%`;
		if (originalImage) {
				// Ridisegna l'immagine e poi applica il nuovo filtro
				processImage();
		}
});

clearBtn.addEventListener('click', clearDrawing);
downloadBtn.addEventListener('click', downloadImage);
eraserBtn.addEventListener('click', toggleEraser);
penBtn.addEventListener('click', togglePen);
menuToggle.addEventListener('click', toggleSidebar);

// Event listeners per il disegno - MOUSE
drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('mouseout', stopDrawing);

// Event listeners per il disegno - TOUCH
drawingCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
drawingCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
drawingCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });

// Previene il comportamento predefinito del tasto destro
drawingCanvas.addEventListener('contextmenu', (e) => {
		e.preventDefault();
});

// Chiudi sidebar quando si clicca fuori
document.addEventListener('click', (e) => {
		if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
				sidebar.classList.remove('open');
		}
});

// Ridimensiona i canvas quando la finestra cambia dimensione
window.addEventListener('resize', () => {
		resizeCanvases();
		if (originalImage) {
				processImage();
		}
});

// Previene lo zoom indesiderato sui dispositivi mobili
document.addEventListener('touchstart', function(e) {
		if (e.touches.length > 1) {
				e.preventDefault();
		}
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
		const now = (new Date()).getTime();
		if (now - lastTouchEnd <= 300) {
				e.preventDefault();
		}
		lastTouchEnd = now;
}, false);

// Inizializzazione
initCanvases();
penBtn.classList.add('active');
