
export const printElement = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // 1. Deep clone the element
  const clone = element.cloneNode(true) as HTMLElement;

  // 2. Remove File Inputs and Range Sliders (cause issues in new windows)
  const fileInputs = clone.querySelectorAll('input[type="file"], input[type="range"]');
  fileInputs.forEach(el => el.remove());

  // 3. SYNC VALUES (Inputs, Textareas, Selects)
  const originalInputs = element.querySelectorAll('input, textarea');
  const clonedInputs = clone.querySelectorAll('input, textarea');

  // We need to map by index, but since we removed some inputs in clone, 
  // we should be careful. Better to rely on the fact that layout is preserved
  // except for the removed hidden inputs.
  // Actually, simpler approach: sync first, then clean clone.
  
  // Re-clone strategy for safety:
  const safeClone = element.cloneNode(true) as HTMLElement;
  
  // Sync Inputs
  const origI = element.querySelectorAll('input, textarea');
  const cloneI = safeClone.querySelectorAll('input, textarea');
  origI.forEach((inp, i) => {
      const el = inp as HTMLInputElement;
      const target = cloneI[i] as HTMLInputElement;
      if (target) {
          if (el.type === 'checkbox' || el.type === 'radio') {
              if (el.checked) target.setAttribute('checked', 'checked');
          } else if (el.type !== 'file') {
              target.setAttribute('value', el.value);
              target.value = el.value;
              if (el.tagName === 'TEXTAREA') target.innerHTML = el.value;
          }
      }
  });

  // Sync Selects
  const origS = element.querySelectorAll('select');
  const cloneS = safeClone.querySelectorAll('select');
  origS.forEach((sel, i) => {
      const target = cloneS[i] as HTMLSelectElement;
      if (target) {
          const val = sel.value;
          const opts = target.querySelectorAll('option');
          opts.forEach(opt => {
              if (opt.value === val) opt.setAttribute('selected', 'selected');
          });
          // For display purposes in print, sometimes it's better to replace select with span, 
          // but we rely on print css to remove arrow appearances.
      }
  });

  // Now clean the safeClone
  safeClone.querySelectorAll('input[type="file"], input[type="range"]').forEach(el => el.remove());

  // 4. Open Window
  const printWindow = window.open('', '_blank', 'width=1123,height=794');
  if (!printWindow) {
    alert('Please allow popups for this website to print the form.');
    return;
  }

  // 5. Write HTML with Image Loading Logic
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>Print Sheet</title>
      <meta charset="UTF-8" />
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        @page { 
          size: A4 landscape; 
          margin: 0; 
        }
        body { 
          margin: 0; 
          padding: 0;
          background: white; 
          font-family: 'Cairo', sans-serif;
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
          zoom: 0.85; 
        }
        #printable-form {
           width: 100% !important;
           min-height: 100vh !important;
           box-shadow: none !important;
           padding: 5mm !important;
           margin: 0 auto !important;
           border: none !important;
        }
        .print-hidden { display: none !important; }
        
        input, textarea, select { 
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
          appearance: none !important;
          -moz-appearance: none !important;
          -webkit-appearance: none !important;
        }
        /* Hide select arrows */
        select::-ms-expand { display: none; }
        
        table { width: 100% !important; border-collapse: collapse !important; }
        
        /* Ensure inputs in tables print fully */
        input { overflow: visible !important; }
      </style>
    </head>
    <body>
      ${safeClone.outerHTML}
      <script>
        // Wait for images to load before printing
        window.onload = function() {
          const images = document.getElementsByTagName('img');
          let loadedCount = 0;
          const totalImages = images.length;

          function tryPrint() {
            loadedCount++;
            if (loadedCount >= totalImages) {
              setTimeout(() => {
                window.print();
                // window.close(); // Keep open for debugging or manual close
              }, 500);
            }
          }

          if (totalImages === 0) {
            tryPrint();
          } else {
            for (let i = 0; i < totalImages; i++) {
              if (images[i].complete) {
                tryPrint();
              } else {
                images[i].onload = tryPrint;
                images[i].onerror = tryPrint;
              }
            }
          }
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
};
