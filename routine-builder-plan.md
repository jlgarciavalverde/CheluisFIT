# Plan de mejora: creación de rutinas en CheluisFIT

## Objetivo
Mejorar la sección de creación de rutinas para que sea más intuitiva, más rápida de usar y más útil tanto para:
- crear una rutina desde cero,
- reutilizar un entrenamiento anterior,
- adaptar la rutina a objetivos concretos y nivel del usuario.

La experiencia debe sentirse premium, clara y enfocada en la progresión del usuario, manteniendo la estética dark theme actual.

---

## 1) Diagnóstico actual
La sección actual probablemente está orientada a un flujo funcional, pero le faltan tres cosas clave:

1. Flujo claro de creación
   - el usuario no siempre sabe si debe empezar desde cero, copiar una sesión previa o usar una plantilla.
2. Poca guía de decisión
   - no se muestran sugerencias inteligentes por objetivo, nivel o días disponibles.
3. Baja diferenciación entre rutinas y entrenamientos
   - el usuario puede confundir “crear rutina” con “hacer sesión ya”.

El rediseño debe dejar muy claro:
- qué es una rutina,
- cómo se compone,
- cómo se reutiliza una sesión anterior,
- y cómo se personaliza en función de objetivos.

---

## 2) Estrategia general
### Principio UX
La creación de rutina debe dividirse en 3 pasos concretos:

1. Elegir punto de partida
   - Desde cero
   - Desde una sesión anterior
   - Desde plantilla
2. Definir estructura
   - días / frecuencia / objetivo / duración
3. Añadir ejercicios y confirmar
   - orden, series, repeticiones, descanso, prioridad

Esto reduce la carga mental y hace que el usuario entienda claramente el proceso.

---

## 3) Flujo A: crear rutina desde cero

### Caso de uso
El usuario quiere crear una rutina para un objetivo concreto y no tiene una referencia previa.

### UX propuesta
#### Pantalla 1: “Empezar una rutina”
a) Tres opciones claras:
- Nueva rutina
- Copiar de entrenamiento anterior
- Usar plantilla

b) Se mostrarán cards con estilo premium:
- Nombre del flujo
- Breve descripción
- Icono y color distintivo

#### Pantalla 2: “Configurar rutina”
Campos:
- Nombre de la rutina
- Objetivo: hipertrofia / fuerza / resistencia / definición / mantenimiento
- Frecuencia semanal: 2, 3, 4, 5, 6 días
- Duración estimada: 30 / 45 / 60 / 75 min
- Nivel: principiante / intermedio / avanzado
- Nivel de intensidad base

#### Pantalla 3: “Seleccionar días”
- Bloques por día: Lunes, Martes, etc.
- Cada día puede tener:
  - un enfoque (pierna, pecho, empuje, tirón, full body)
  - ejercicios asociados
  - descanso o descanso activo

#### Pantalla 4: “Añadir ejercicios”
- Buscador de ejercicios
- Chips rápidos por grupo muscular
- Opción de añadir desde favoritos o historial
- Cada ejercicio tiene:
  - nombre
  - gif o imagen
  - músculo principal
  - equipo
  - series
  - repeticiones
  - descanso
  - nota opcional

#### Pantalla 5: “Resumen y guardar”
- Vista global de la semana
- Cantidad total de sesiones
- Tiempo estimado
- Distribución muscular
- Botón “Guardar rutina”

---

## 4) Flujo B: crear rutina desde un entrenamiento anterior

### Caso de uso
El usuario quiere recuperar una rutina o una sesión que ya hizo y usarla como base.

### UX propuesta
#### Pantalla: “Reutilizar entrenamiento”
Mostrar lista de entrenamientos anteriores con:
- fecha
- nombre de la sesión
- tipo de sesión
- duración
- volumen total
- estado completado o incompleto

Cada card tendrá acciones:
- “Usar como base”
- “Previsualizar”
- “Editar antes de guardar”

### Reglas de reutilización
- Copiar ejercicios y orden
- Mantener series/reps si el usuario quiere
- Permitir ajuste automático para cambiar a 3 días/4 días/5 días
- Opción de “reorganizar por objetivo”

### Valor añadido
Esto reduce la fricción de empezar desde cero y elimina la sensación de que la app exige empezar de zero cada vez.

---

## 5) Estructura recomendada de componentes

### Pantallas principales
- RoutinesScreen.tsx
- RoutineBuilderScreen.tsx
- RoutineDetailScreen.tsx
- RoutineTemplatePickerScreen.tsx
- PreviousWorkoutImportSheet.tsx

### Componentes reutilizables
- RoutineOverviewCard
- DayChipSelector
- ExerciseSlotCard
- RoutineSummaryBar
- GoalSelector
- FrequencySelector
- DurationPill
- TemplateCard
- ImportWorkoutCard
- SessionPreviewSheet

### Componentes de UX premium
- Segmented controls para objetivo/frecuencia
- Bottom Sheets para importar entrenamientos o añadir ejercicios
- Sticky headers para resumen del plan
- Chips para categorías rápidas
- Cards con metricas de volumen / frecuencia / duración

---

## 6) Estado y lógica recomendada

### Estado local necesario
- name
- goal
- weeklyFrequency
- durationMinutes
- difficulty
- days: list of routine days
- exercisesByDay
- templateSource
- importedFromSessionId

### Datos útiles del backend
- workout templates
- historic workout sessions
- favorite exercises
- exercises list / search
- optional analytics of volume per exercise

### Lógica sugerida
- normalizar datos provenientes de sesiones previas para crear PlanDay objects
- validar que cada día tenga al menos un ejercicio
- prevenir rutinas vacías
- permitir edición antes de guardar final
- guardar como `workoutTemplate` o `routine`

---

## 7) Experiencia de edición de rutina
La edición debe ser muy fácil visualmente.

### Por día
Cada día debe tener:
- nombre (Pecho, Pierna, etc.)
- lista de ejercicios
- botón “Añadir ejercicio”
- botón “Duplicar día”
- botón “Eliminar día”

### Por ejercicio
Cada ejercicio en la rutina debe permitir:
- cambiar serie/reps
- poner descanso
- cambiar orden
- marcar como “principal” o “superset”
- añadir nota personal

### UX de edición recomendada
- Lista vertical por día
- Drag & drop o reordenación simple si la plataforma lo permite
- Bottom Sheet para edición rápida del ejercicio

---

## 8) Sugerencias inteligentes para mejorar retención

### A. Recomendaciones por objetivo
Si el objetivo es hipertrofia, sugerir:
- 4-5 días
- 6-12 repeticiones
- volumen mayor

Si es fuerza:
- 3-4 días
- repeticiones bajas
- ejercicios compuestos

Si es pérdida de grasa:
- 3-5 días con cardio o superseries
- mayor frecuencia y menor tiempo de descanso

### B. Optimización por historial
- recomendar ejercicios ya usados y con mejor rendimiento
- sugerir objetivos en base al progreso del usuario
- sugerir “siguiente paso” cuando el usuario repite mucho la misma estructura

### C. Plantillas premium
Cada plantilla debe mostrarse con:
- objetivo
- nivel
- duración
- tipo de split
- etiquetas de dificultad

---

## 9) Arquitectura recomendada para desarrollo

### Flujo de datos
1. user opens routines section
2. chooses source: new / historic / template
3. builder state initializes from selected source
4. user edits days and exercises
5. save routine to backend
6. routine is available in routines list and can be used in training

### Estructura sugerida
- `RoutineBuilderScreen` = orchestration layer
- `RoutineSourceSelector` = elegir la base
- `RoutineConfigForm` = datos generales
- `RoutineDayEditor` = edición por días
- `ExerciseSelectorSheet` = añadir ejercicios
- `RoutineSummaryPanel` = resumen final

---

## 10) Roadmap de implementación

### Fase 1: MVP funcional
- selector de origen
- formulario básico de configuración
- creación por días
- añadir ejercicios desde la búsqueda
- guardar rutina

### Fase 2: UX premium
- tarjetas de origen
- chips para objetivos
- bottom sheets
- mejor resumen visual
- importación desde sesiones históricas

### Fase 3: Inteligencia
- recomendaciones automáticas
- sugerencias por objetivo y nivel
- priorización por historial del usuario

### Fase 4: Retención y engagement
- comparativa de progreso con rutinas previas
- “continuar con la última rutina”
- “adaptar rutina por fatiga / recuperación”

---

## 11) Recomendación final
La mejora principal no es solo “hacer una pantalla más bonita”, sino convertir la creación de rutinas en un flujo guiado, rápido y emocionalmente claro.

El usuario debe sentir que:
- no está empezando desde cero,
- puede reutilizar lo que ya le funcionó,
- y puede adaptar el plan sin frustración.

Eso aumenta la probabilidad de que use la app con continuidad y la considere una herramienta útil en vez de una simple lista de ejercicios.

---

## 12) Siguiente paso recomendado
Implementar primero:
1. selector de origen (nuevo / histórico / plantilla),
2. configuración de rutina,
3. edición por días,
4. importación desde entrenamiento previo,
5. guardado del template.

Esto genera el mayor valor inmediato sin tocar demasiado el backend.
