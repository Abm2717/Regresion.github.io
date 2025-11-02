<script setup>
import { ref, watch, computed } from 'vue'
import { regresionPolinomial, gaussJordan } from './Metodos.js'

const tipoRegresion = ref('ninguno')
const numDatos = ref('')
const gradoPolinomio = ref('')
const numVariables = ref('')
const mostrarAlerta = ref(false)
const msjAlerta = ref('')
const resultados = ref(null)
const tablaSumatorias = ref(null)

const puntos = ref([])

const opcionesTipo = [
  { value: 'ninguno', label: 'Selecciona tipo de regresion' },
  { value: 'linealSimple', label: 'Regresion Lineal Simple' },
  { value: 'polinomial', label: 'Regresion Polinomial' }
]

const tituloColumnas = computed(() => {
  if (tipoRegresion.value === 'linealSimple' || tipoRegresion.value === 'polinomial') {
    return ['x', 'y']
  }
  return []
})

watch(tipoRegresion, (nuevoTipo) => {
  numDatos.value = ''
  gradoPolinomio.value = ''
  numVariables.value = ''
  puntos.value = []
  resultados.value = null
})

watch(numDatos, (nuevoNum) => {
  if (nuevoNum === '' || parseInt(nuevoNum) <= 0) {
    puntos.value = []
    return
  }
  
  const n = parseInt(nuevoNum)
  const numCols = tituloColumnas.value.length
  
  if (numCols > 0) {
    puntos.value = Array(n).fill(null).map(() => Array(numCols).fill(''))
  }
})


function bloquearTeclas(event) {
  if(["e", "E"].includes(event.key)) {
    event.preventDefault()
    return
  }
}

function bloquearNegativos(event) {
  if(["e", "E", "-", "+"].includes(event.key)) {
    event.preventDefault()
    return
  }
}

function validarInputs() {
  if (tipoRegresion.value === 'ninguno' || numDatos.value === '' || parseInt(numDatos.value) <= 0) {
    return false
  }
  
  if (tipoRegresion.value === 'polinomial' && (gradoPolinomio.value === '' || parseInt(gradoPolinomio.value) < 1)) {
    return false
  }
  
  const n = parseInt(numDatos.value)
  const numCols = tituloColumnas.value.length
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < numCols; j++) {
      if (puntos.value[i][j] === '' || puntos.value[i][j] === null) {
        return false
      }
    }
  }
  
  return true
}

function cerrarAlerta() {
  mostrarAlerta.value = false
}

function calcularRegresion() {
  mostrarAlerta.value = false
  
  if (!validarInputs()) {
    msjAlerta.value = 'Llena todos los campos requeridos y la tabla de datos'
    mostrarAlerta.value = true
    return
  }
  
  const puntosNumericos = puntos.value.map(fila => fila.map(val => parseFloat(val)))
  
  for (let i = 0; i < puntosNumericos.length; i++) {
    for (let j = 0; j < puntosNumericos[i].length; j++) {
      if (isNaN(puntosNumericos[i][j])) {
        msjAlerta.value = 'Error: Todos los valores deben ser numeros validos'
        mostrarAlerta.value = true
        return
      }
    }
  }
  
  try {
    let coeficientes
    let metodo = ''
    let grado = 1
    
    if (tipoRegresion.value === 'linealSimple') {
      grado = 1
      coeficientes = regresionPolinomial(puntosNumericos, grado, gaussJordan)
      metodo = 'Regresion Lineal Simple'
      
      if (coeficientes.some(c => isNaN(c) || !isFinite(c))) {
        throw new Error('No se puede calcular la regresion.')
      }
      
      resultados.value = {
        tipo: 'linealSimple',
        coeficientes: coeficientes.map(val => parseFloat(val.toFixed(6))),
        metodo: metodo
      }
    } else if (tipoRegresion.value === 'polinomial') {
      grado = parseInt(gradoPolinomio.value)
      
      if (puntosNumericos.length <= grado) {
        msjAlerta.value = `Error: Se necesitan al menos ${grado + 1} puntos para un polinomio de grado ${grado}`
        mostrarAlerta.value = true
        return
      }
      
      coeficientes = regresionPolinomial(puntosNumericos, grado, gaussJordan)
      metodo = `Regresion Polinomial (grado ${grado})`

      if (coeficientes.some(c => isNaN(c) || !isFinite(c))) {
        throw new Error('No se puede calcular la regresion.')
      }
      
      resultados.value = {
        tipo: 'polinomial',
        coeficientes: coeficientes.map(val => parseFloat(val.toFixed(6))),
        metodo: metodo,
        grado: grado
      }
    }
    
    calcularTablaSumatorias(puntosNumericos, grado)
    
  } catch (error) {
    msjAlerta.value = 'Error al calcular la regresion: ' + error.message
    mostrarAlerta.value = true
    resultados.value = null
    tablaSumatorias.value = null
  }
}

function calcularTablaSumatorias(puntosNum, grado) {
  const n = puntosNum.length
  const columnas = []
  const filas = []
  
  columnas.push('xᵢ')
  columnas.push('yᵢ')
  
  for (let k = 2; k <= 2 * grado; k++) {
    columnas.push(`xᵢ^${k}`)
  }

  for (let k = 1; k <= grado; k++) {
    if (k === 1) {
      columnas.push('xᵢ * yᵢ')
    } else {
      columnas.push(`xᵢ^${k} * yᵢ`)
    }
  }

  const sumatorias = Array(columnas.length).fill(0)
  
  for (let i = 0; i < n; i++) {
    const x = puntosNum[i][0]
    const y = puntosNum[i][1]
    const fila = []
    
    const xVal = parseFloat(x.toFixed(4))
    fila.push(isNaN(xVal) ? 'Error' : xVal)
    if (!isNaN(xVal)) sumatorias[0] += x
    
    const yVal = parseFloat(y.toFixed(4))
    fila.push(isNaN(yVal) ? 'Error' : yVal)
    if (!isNaN(yVal)) sumatorias[1] += y
    
    let idx = 2
    for (let k = 2; k <= 2 * grado; k++) {
      const valor = Math.pow(x, k)
      const val = parseFloat(valor.toFixed(4))
      fila.push(isNaN(val) || !isFinite(val) ? 'Error' : val)
      if (!isNaN(val) && isFinite(val)) sumatorias[idx] += valor
      idx++
    }

    for (let k = 1; k <= grado; k++) {
      const valor = Math.pow(x, k) * y
      const val = parseFloat(valor.toFixed(4))
      fila.push(isNaN(val) || !isFinite(val) ? 'Error' : val)
      if (!isNaN(val) && isFinite(val)) sumatorias[idx] += valor
      idx++
    }
    
    filas.push(fila)
  }
  
  const filaSuma = []
  for (let i = 0; i < sumatorias.length; i++) {
    const val = parseFloat(sumatorias[i].toFixed(4))
    filaSuma.push(isNaN(val) || !isFinite(val) ? 'Error' : val)
  }
  filas.push(filaSuma)
  
  tablaSumatorias.value = {
    columnas,
    filas
  }
}

function limpiarDatos() {
  if (numDatos.value && puntos.value.length > 0) {
    const n = parseInt(numDatos.value)
    const numCols = tituloColumnas.value.length
    puntos.value = Array(n).fill(null).map(() => Array(numCols).fill(''))
    resultados.value = null
  }
}

function obtenerPolinomioTexto(coefs) {
  let texto = 'y = '
  for (let i = 0; i < coefs.length; i++) {
    const coef = coefs[i]
    if (i === 0) {
      texto += coef
    } else if (i === 1) {
      texto += ` ${coef >= 0 ? '+' : ''} ${coef}x`
    } else {
      texto += ` ${coef >= 0 ? '+' : ''} ${coef}x^${i}`
    }
  }
  return texto
}

function obtenerTextoFuncion() {
  if (!resultados.value) return ''
  
  if (resultados.value.tipo === 'linealSimple') {
    return `y = ${resultados.value.coeficientes[0]} ${resultados.value.coeficientes[1] >= 0 ? '+' : ''} ${resultados.value.coeficientes[1]}x`
  } else if (resultados.value.tipo === 'polinomial') {
    return obtenerPolinomioTexto(resultados.value.coeficientes)
  }
  return ''
}
</script>

<template>
  <div class="container">
    <h1>Metodos de Regresion</h1>
    <p>Selecciona el tipo de regresion, ingresa los datos y obten la funcion de ajuste.</p>
    
    <div v-if="mostrarAlerta" class="alerta">
      <div class="alerta-contenido">
        <span class="icono-alerta"></span>
        <span class="mensaje-alerta">{{ msjAlerta }}</span>
        <button class="boton-cerrar" @click="cerrarAlerta">×</button>
      </div>
    </div>

    <div class="selectores">
      <label class="selector-tipo">
        Tipo de regresion
        <select v-model="tipoRegresion" class="select-opcion">
          <option v-for="opcion in opcionesTipo" :key="opcion.value" :value="opcion.value">
            {{ opcion.label }}
          </option>
        </select>
      </label>
    </div>

    <div v-if="tipoRegresion !== 'ninguno'" class="parametros">
      <div class="parametros-grid">
        <label class="input-parametro">
          Numero de datos
          <input
            type="number"
            v-model.number="numDatos"
            @keydown="bloquearNegativos"
            min="1"
            step="1"
            class="input-numero"
            placeholder="Ej: 5"
          />
        </label>

        <label v-if="tipoRegresion === 'polinomial'" class="input-parametro">
          Grado del polinomio
          <input
            type="number"
            v-model.number="gradoPolinomio"
            @keydown="bloquearNegativos"
            min="1"
            step="1"
            class="input-numero"
            placeholder="Ej: 2"
          />
        </label>
      </div>
    </div>

    <div v-if="puntos.length > 0" class="seccion-datos">
      <div class="datos-header">
        <h3>Tabla de Datos</h3>
        <button @click="limpiarDatos" class="boton-limpiar">
          Limpiar Tabla
        </button>
      </div>
      
      <div class="tabla-container">
        <table class="tabla-datos">
          <thead>
            <tr>
              <th class="col-index">#</th>
              <th v-for="(col, idx) in tituloColumnas" :key="'col-' + idx" class="col-dato">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(fila, i) in puntos" :key="'fila-' + i">
              <td class="col-index">{{ i + 1 }}</td>
              <td v-for="(val, j) in fila" :key="'dato-' + i + '-' + j" class="col-dato">
                <input
                  type="number"
                  v-model.number="puntos[i][j]"
                  @keydown="bloquearTeclas"
                  step="0.01"
                  class="input-dato"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="puntos.length > 0" class="botones-accion">
      <button @click="calcularRegresion" class="boton-principal">
        Calcular Regresion
      </button>
    </div>

    <div v-if="resultados" class="resultados-wrapper">
      <div class="resultados-header">
        <h2>Resultados</h2>
        <div class="metodo-usado">
          <span class="metodo-badge">{{ resultados.metodo }}</span>
        </div>
      </div>

      <div v-if="tablaSumatorias" class="tabla-sumatorias-section">
        <h3>Tabla de Sumatorias</h3>
        <div class="tabla-container">
          <table class="tabla-sumatorias">
            <thead>
              <tr>
                <th class="col-indice-header"></th>
                <th v-for="(col, idx) in tablaSumatorias.columnas" :key="'col-' + idx">
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fila, i) in tablaSumatorias.filas" :key="'fila-' + i" 
                  :class="{ 'fila-suma': i === tablaSumatorias.filas.length - 1 }">
                <td class="col-indice">
                  {{ i === tablaSumatorias.filas.length - 1 ? 'Σ' : '' }}
                </td>
                <td v-for="(valor, j) in fila" :key="'val-' + i + '-' + j">
                  {{ valor }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="funcion-resultado">
        <h3>Funcion de ajuste:</h3>
        <div class="funcion-texto">
          {{ obtenerTextoFuncion() }}
        </div>
      </div>

      <div class="coeficientes-section">
        <h3>Coeficientes:</h3>
        <div class="coeficientes-grid">
          <div 
            v-for="(coef, i) in resultados.coeficientes" 
            :key="'coef-' + i" 
            class="coeficiente-item"
            :class="'coef-' + (i % 4)"
          >
            <span class="coef-nombre">
              {{ resultados.tipo === 'linealSimple' 
                  ? (i === 0 ? 'a₀' : 'a₁')
                  : (i === 0 ? 'a₀' : i === 1 ? 'a₁' : `a${i}`)
              }}
            </span>
            <span class="coef-igual">=</span>
            <span class="coef-valor">{{ coef }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: auto;
  padding: 2rem;
  background: #242424;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.6);
  font-family: system-ui, sans-serif;
  color: #f9fafb;
}

h1 {
  text-align: center;
  color: #60a5fa;
  margin-bottom: 1rem;
  font-size: 1.8rem;
}

p {
  color: #d1d5db;
  text-align: center;
  margin-bottom: 1.5rem;
}

.alerta {
  margin-bottom: 1rem;
  animation: slideDown 0.3s ease-out;
}

.alerta-contenido {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #7c2d12;
  border: 1px solid #dc2626;
  border-radius: 0.5rem;
  color: #fef2f2;
  position: relative;
}

.icono-alerta {
  margin-right: 0.5rem;
  font-size: 1.2rem;
}

.mensaje-alerta {
  flex: 1;
  font-weight: 500;
}

.boton-cerrar {
  background: none;
  border: none;
  color: #fef2f2;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  margin: 0;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.boton-cerrar:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selectores {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.selector-tipo {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  color: #e5e7eb;
  flex: 1;
  min-width: 300px;
}

.select-opcion {
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 0.5rem;
  margin-top: 0.3rem;
  background: #1f1f1f;
  color: #f9fafb;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.select-opcion:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.parametros {
  background: #1f1f1f;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #333;
}

.parametros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.input-parametro {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  color: #e5e7eb;
}

.input-numero {
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 0.5rem;
  margin-top: 0.3rem;
  background: #2d2d2d;
  color: #f9fafb;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-size: 1rem;
}

.input-numero:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.input-numero::-webkit-outer-spin-button,
.input-numero::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-numero[type="number"] {
  -moz-appearance: textfield;
}

.seccion-datos {
  background: #1f1f1f;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #333;
}

.datos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.datos-header h3 {
  color: #60a5fa;
  margin: 0;
  font-size: 1.2rem;
}

.boton-limpiar {
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.boton-limpiar:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.tabla-container {
  overflow-x: auto;
}

.tabla-datos {
  width: 100%;
  border-collapse: collapse;
}

.tabla-datos thead {
  background: #2d2d2d;
}

.tabla-datos th {
  padding: 0.75rem;
  text-align: center;
  color: #60a5fa;
  font-weight: 600;
  border: 1px solid #444;
}

.tabla-datos td {
  padding: 0.5rem;
  text-align: center;
  border: 1px solid #444;
  vertical-align: middle;
}

.col-dato {
  min-width: 120px;
  width: auto;
}

.col-index {
  background: #2d2d2d;
  color: #d1d5db;
  font-weight: 600;
  width: 60px;
}

.input-dato {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 0.3rem;
  background: #242424;
  color: #f9fafb;
  text-align: center;
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;
}

.input-dato:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}

.input-dato::-webkit-outer-spin-button,
.input-dato::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-dato[type="number"] {
  -moz-appearance: textfield;
}

.botones-accion {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.boton-principal {
  padding: 0.8rem 2rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.boton-principal:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.resultados-wrapper {
  margin-top: 2rem;
  background: #1f1f1f;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #333;
  animation: fadeIn 0.5s ease-out;
}

.resultados-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.resultados-header h2 {
  color: #60a5fa;
  margin: 0;
  font-size: 1.4rem;
}

.metodo-badge {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.tabla-sumatorias-section {
  margin-bottom: 2rem;
}

.tabla-sumatorias-section h3 {
  color: #60a5fa;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.tabla-sumatorias {
  width: 100%;
  border-collapse: collapse;
  background: #2d2d2d;
  border-radius: 0.5rem;
  overflow: hidden;
  table-layout: fixed;
}

.tabla-sumatorias thead {
  background: #3b82f6;
}

.tabla-sumatorias th {
  padding: 0.75rem;
  text-align: center;
  color: white;
  font-weight: 600;
  border: 1px solid #2563eb;
  font-size: 0.95rem;
  width: auto;
}

.tabla-sumatorias th.col-indice-header {
  width: 60px;
  background: #3b82f6;
}

.tabla-sumatorias tbody tr {
  background: #e0e7ff;
}

.tabla-sumatorias tbody tr:nth-child(even):not(.fila-suma) {
  background: #c7d2fe;
}

.tabla-sumatorias tbody tr.fila-suma {
  background: #3b82f6;
  font-weight: 700;
}

.tabla-sumatorias tbody tr.fila-suma td {
  color: white;
  font-size: 1rem;
}

.tabla-sumatorias td {
  padding: 0.6rem;
  text-align: center;
  border: 1px solid #93c5fd;
  color: #1e293b;
  font-weight: 500;
  width: auto;
}

.tabla-sumatorias td.col-indice {
  background: #3b82f6;
  color: white;
  font-weight: 600;
  width: 60px;
}

.tabla-sumatorias tr.fila-suma td.col-indice {
  background: #2563eb;
  font-size: 1.2rem;
}

.funcion-resultado {
  background: #2d2d2d;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 2px solid #60a5fa;
}

.funcion-resultado h3 {
  color: #60a5fa;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.funcion-texto {
  font-size: 1.3rem;
  font-family: 'Courier New', monospace;
  color: #f9fafb;
  font-weight: 600;
  word-break: break-word;
}

.coeficientes-section h3 {
  color: #60a5fa;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
}

.coeficientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.coeficiente-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.2rem;
  border-radius: 0.5rem;
  border: 2px solid;
  transition: transform 0.2s ease;
}

.coeficiente-item:hover {
  transform: translateY(-2px);
}

.coef-0 {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
}

.coef-1 {
  background: rgba(168, 85, 247, 0.1);
  border-color: #a855f7;
}

.coef-2 {
  background: rgba(249, 115, 22, 0.1);
  border-color: #f97316;
}

.coef-3 {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.coef-nombre {
  font-size: 1.5rem;
  font-weight: 700;
}

.coef-0 .coef-nombre { color: #22c55e; }
.coef-1 .coef-nombre { color: #a855f7; }
.coef-2 .coef-nombre { color: #f97316; }
.coef-3 .coef-nombre { color: #3b82f6; }

.coef-igual {
  font-size: 1.3rem;
  color: #d1d5db;
}

.coef-valor {
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: #f9fafb;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .parametros-grid {
    grid-template-columns: 1fr;
  }
  
  .coeficientes-grid {
    grid-template-columns: 1fr;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>