import type { MuscleMapPath } from "./types";

export const frontSilhouette =
  "M100 14 C83 14 72 28 72 48 C72 63 82 75 100 75 C118 75 128 63 128 48 C128 28 117 14 100 14 Z M82 82 L118 82 C137 88 150 103 155 126 L173 217 C176 232 166 240 156 229 L137 153 L130 221 L144 405 C145 421 133 433 121 419 L101 276 L98 276 L79 419 C67 433 55 421 56 405 L70 221 L63 153 L44 229 C34 240 24 232 27 217 L45 126 C50 103 63 88 82 82 Z";

export const backSilhouette =
  "M100 14 C83 14 72 28 72 48 C72 63 82 75 100 75 C118 75 128 63 128 48 C128 28 117 14 100 14 Z M82 82 L118 82 C139 88 151 105 155 130 L172 219 C175 233 166 241 156 229 L137 154 L129 221 L143 405 C145 421 133 433 121 419 L101 276 L98 276 L79 419 C67 433 55 421 57 405 L71 221 L63 154 L44 229 C34 241 25 233 28 219 L45 130 C49 105 61 88 82 82 Z";

export const frontMusclePaths: MuscleMapPath[] = [
  {
    id: "frontShoulders",
    d: "M80 88 C64 91 50 106 46 128 L61 132 C66 118 73 107 86 101 Z",
    mirror: true,
  },
  {
    id: "chest",
    d: "M82 101 C70 106 63 119 63 139 C72 149 88 148 97 134 L97 103 C92 101 87 100 82 101 Z",
    mirror: true,
  },
  {
    id: "serratus",
    d: "M63 142 C69 151 78 156 88 158 L84 177 C73 171 66 161 62 149 Z",
    mirror: true,
  },
  {
    id: "biceps",
    d: "M45 132 C37 150 34 176 32 201 C36 206 43 206 49 201 L59 136 Z",
    mirror: true,
  },
  {
    id: "forearms",
    d: "M32 205 C28 221 28 237 33 252 C38 259 47 255 48 247 L49 206 C44 210 37 210 32 205 Z",
    mirror: true,
  },
  {
    id: "obliques",
    d: "M76 154 C79 166 82 184 83 205 L96 205 L96 153 C89 158 82 159 76 154 Z",
    mirror: true,
  },
  {
    id: "abs",
    d: "M86 150 L114 150 C119 172 118 194 112 216 L88 216 C82 194 81 172 86 150 Z",
  },
  {
    id: "abductors",
    d: "M70 221 C63 243 61 269 60 293 L80 293 C84 265 88 241 96 222 Z",
    mirror: true,
  },
  {
    id: "adductors",
    d: "M83 222 L98 222 L97 304 L80 304 C82 278 82 250 83 222 Z",
    mirror: true,
  },
  {
    id: "quads",
    d: "M61 296 C61 328 58 361 56 391 C64 401 75 397 79 385 L85 307 Z",
    mirror: true,
  },
  {
    id: "calvesFront",
    d: "M57 393 C55 410 61 424 73 423 C79 410 83 393 81 374 C74 388 66 394 57 393 Z",
    mirror: true,
  },
];

export const backMusclePaths: MuscleMapPath[] = [
  {
    id: "traps",
    d: "M78 83 C85 97 92 107 100 112 C108 107 115 97 122 83 L112 82 C108 90 104 95 100 98 C96 95 92 90 88 82 Z",
  },
  {
    id: "backShoulders",
    d: "M80 91 C63 95 51 109 47 129 L62 134 C67 119 75 109 88 102 Z",
    mirror: true,
  },
  {
    id: "upperBack",
    d: "M78 104 C84 116 91 124 99 130 L99 151 C86 145 74 134 66 120 Z",
    mirror: true,
  },
  {
    id: "lats",
    d: "M66 126 C75 140 86 151 98 157 L94 211 C79 195 68 174 63 151 Z",
    mirror: true,
  },
  {
    id: "triceps",
    d: "M47 134 C39 152 36 177 35 200 C41 207 49 205 53 197 L61 138 Z",
    mirror: true,
  },
  {
    id: "forearms",
    d: "M35 205 C30 223 30 239 35 253 C41 259 49 255 50 246 L52 205 C47 210 40 210 35 205 Z",
    mirror: true,
  },
  {
    id: "lowerBack",
    d: "M84 170 C91 176 109 176 116 170 L112 220 L88 220 Z",
  },
  {
    id: "glutes",
    d: "M72 220 C84 214 95 219 99 234 L99 271 C84 270 72 260 68 246 Z",
    mirror: true,
  },
  {
    id: "hamstrings",
    d: "M63 272 C67 298 68 334 60 386 C67 397 78 393 81 379 L92 277 Z",
    mirror: true,
  },
  {
    id: "calvesBack",
    d: "M60 388 C56 407 62 424 73 423 C82 408 84 390 80 372 C75 385 68 391 60 388 Z",
    mirror: true,
  },
];
