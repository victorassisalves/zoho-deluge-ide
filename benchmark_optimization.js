const { JSDOM } = require('jsdom');
const { performance } = require('perf_hooks');

const dom = new JSDOM('<!DOCTYPE html><html><body><select id="project-selector"></select></body></html>');
const document = dom.window.document;
const selector = document.getElementById('project-selector');

const projects = Array.from({ length: 10000 }, (_, i) => ({
    id: `proj_${i}`,
    name: `Project ${i}`
}));

function benchmarkBaseline() {
    selector.innerHTML = '';
    // Force garbage collection if possible? No.
    const start = performance.now();

    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        // Using innerText is generally faster and safe for text
        opt.innerText = p.name;
        selector.appendChild(opt);
    });

    const end = performance.now();
    return end - start;
}

function benchmarkOptimized() {
    selector.innerHTML = '';
    const start = performance.now();

    const fragment = document.createDocumentFragment();
    projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = p.name;
        fragment.appendChild(opt);
    });
    selector.appendChild(fragment);

    const end = performance.now();
    return end - start;
}

// Warmup
benchmarkBaseline();
benchmarkOptimized();

console.log('Running benchmark...');
const iterations = 5;
let baselineTotal = 0;
let optimizedTotal = 0;

for (let i = 0; i < iterations; i++) {
    baselineTotal += benchmarkBaseline();
    optimizedTotal += benchmarkOptimized();
}

const baselineAvg = baselineTotal / iterations;
const optimizedAvg = optimizedTotal / iterations;

console.log('Baseline Avg:', baselineAvg.toFixed(4), 'ms');
console.log('Optimized Avg:', optimizedAvg.toFixed(4), 'ms');
const improv = ((baselineAvg - optimizedAvg) / baselineAvg * 100);
console.log('Improvement:', improv.toFixed(2) + '%');

if (optimizedAvg >= baselineAvg) {
    console.log('Note: JSDOM might not reflect browser layout thrashing costs.');
}
