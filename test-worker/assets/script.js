console.log('Script loaded'); try { const w = new Worker('./worker.js'); } catch (e) { console.error(e); }
