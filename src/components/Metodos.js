
export function mayorColumna(matriz, k) {
    let filaMax = k
    let valorMax = Math.abs(matriz[k][k])
    for (let i = k + 1; i < matriz.length; i++) {
        if (Math.abs(matriz[i][k]) > valorMax) {
            valorMax = Math.abs(matriz[i][k])
            filaMax = i
        }
    }
    return filaMax
}


export function gaussJordan(matriz) {
    const n = matriz.length

    for (let k = 0; k < n; k++) {
        
        const filaMax = mayorColumna(matriz, k)
        if (filaMax !== k) {
            [matriz[k], matriz[filaMax]] = [matriz[filaMax], matriz[k]]
        }

        
        const pivote = matriz[k][k]
        for (let j = k; j <= n; j++) {
            matriz[k][j] /= pivote
        }

        
        for (let i = 0; i < n; i++) {
            if (i !== k) {
                const factor = matriz[i][k]
                for (let j = k; j <= n; j++) {
                    matriz[i][j] -= factor * matriz[k][j]
                }
            }
        }
    }

    return matriz.map(fila => fila[n])
}

export function creaSumatorias(puntos, sx, sxy, n) {
    const m = puntos.length;
    
    for (let i = 0; i <= 2 * n; i++) {
        sx[i] = 0;
    }
    for (let i = 0; i <= n; i++) {
        sxy[i] = 0;
    }
    
    for (let i = 0; i < m; i++) {
        const x = puntos[i][0];
        const y = puntos[i][1];
        
        for (let k = 0; k <= 2 * n; k++) {
            sx[k] += Math.pow(x, k);
        }

        for (let k = 0; k <= n; k++) {
            sxy[k] += y * Math.pow(x, k);
        }
    }
}


export function creaMatrizSumatorias(sx, sxy, n) {
    const matriz = [];
    
    for (let i = 0; i <= n; i++) {
        matriz[i] = [];
        for (let j = 0; j <= n; j++) {
            matriz[i][j] = sx[i + j];
        }
        matriz[i][n + 1] = sxy[i];
    }
    
    return matriz;
}

export function regresionPolinomial(puntos, n, gaussJordan) {
    const sx = [];
    const sxy = [];
    
    creaSumatorias(puntos, sx, sxy, n);
    
    const matriz = creaMatrizSumatorias(sx, sxy, n);
    
    const coeficientes = gaussJordan(matriz);
    
    return coeficientes;
}

export function creaMatrizSumatoriasRLM(puntos) {
    const m = puntos.length; 
    const n = puntos[0].length - 1; 
    const matriz = [];
    
    for (let i = 0; i <= n; i++) {
        matriz[i] = [];
        for (let j = 0; j <= n + 1; j++) {
            matriz[i][j] = 0;
        }
    }
    
    matriz[0][0] = m;
    for (let j = 0; j < n; j++) {
        let suma = 0;
        for (let i = 0; i < m; i++) {
            suma += puntos[i][j];
        }
        matriz[0][j + 1] = suma;
    }
    let sumaY = 0;
    for (let i = 0; i < m; i++) {
        sumaY += puntos[i][n];
    }
    matriz[0][n + 1] = sumaY;

    for (let k = 1; k <= n; k++) {
        matriz[k][0] = matriz[0][k];
        
        for (let j = 1; j <= n; j++) {
            let suma = 0;
            for (let i = 0; i < m; i++) {
                suma += puntos[i][k - 1] * puntos[i][j - 1];
            }
            matriz[k][j] = suma;
        }
        
        let sumaXY = 0;
        for (let i = 0; i < m; i++) {
            sumaXY += puntos[i][k - 1] * puntos[i][n];
        }
        matriz[k][n + 1] = sumaXY;
    }
    
    return matriz;
}

export function regresionLinealMultiple(puntos, gaussJordan) {
    const matriz = creaMatrizSumatoriasRLM(puntos);
    const coeficientes = gaussJordan(matriz);
    return coeficientes;
}