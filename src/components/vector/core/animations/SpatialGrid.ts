import { AnimatedVectorItem } from './animationTypes';

export class SpatialGrid {
  private grid: Map<string, Set<AnimatedVectorItem>>;
  private cellSize: number;
  private width: number;
  private height: number;
  private cols: number;
  private rows: number;
  private items: Map<string, string>; // Mapa de ID de vector a clave de celda

  constructor(cellSize: number, width: number, height: number) {
    this.grid = new Map();
    this.items = new Map();
    this.cellSize = cellSize;
    this.width = width;
    this.height = height;
    this.cols = Math.max(1, Math.ceil(width / cellSize));
    this.rows = Math.max(1, Math.ceil(height / cellSize));
  }

  private getCellKey(x: number, y: number): string {
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    return `${col},${row}`;
  }

  private getNeighborCells(x: number, y: number): string[] {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    const keys: string[] = [];
    
    // Revisar celdas vecinas (incluyendo la actual)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const c = col + i;
        const r = row + j;
        if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
          keys.push(`${c},${r}`);
        }
      }
    }
    
    return keys;
  }

  clear(): void {
    this.grid.clear();
    this.items.clear();
  }
  
  size(): number {
    return this.items.size;
  }

  insert(item: AnimatedVectorItem): void {
    const key = this.getCellKey(item.baseX, item.baseY);
    const itemId = item.id;
    
    // Si el ítem ya está en la cuadrícula, lo quitamos primero
    this.remove(itemId);
    
    // Añadimos el ítem a la celda correspondiente
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key)!.add(item);
    this.items.set(itemId, key);
  }
  
  remove(itemId: string): void {
    const key = this.items.get(itemId);
    if (key) {
      const cell = this.grid.get(key);
      if (cell) {
        for (const item of cell) {
          if (item.id === itemId) {
            cell.delete(item);
            break;
          }
        }
        // Eliminar la celda si está vacía
        if (cell.size === 0) {
          this.grid.delete(key);
        }
      }
      this.items.delete(itemId);
    }
  }
  
  update(item: AnimatedVectorItem): void {
    const oldKey = this.items.get(item.id);
    const newKey = this.getCellKey(item.baseX, item.baseY);
    
    // Solo actualizar si la celda cambió
    if (oldKey !== newKey) {
      this.remove(item.id);
      this.insert(item);
    }
  }

  query(x: number, y: number, radius: number): AnimatedVectorItem[] {
    const result: AnimatedVectorItem[] = [];
    const radiusSq = radius * radius;
    const cellX = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellSize)));
    const cellY = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellSize)));
    
    // Calcular el rango de celdas a verificar
    const cellRadius = Math.ceil(radius / this.cellSize);
    const minX = Math.max(0, cellX - cellRadius);
    const maxX = Math.min(this.cols - 1, cellX + cellRadius);
    const minY = Math.max(0, cellY - cellRadius);
    const maxY = Math.min(this.rows - 1, cellY + cellRadius);
    
    // Verificar solo las celdas relevantes
    for (let i = minX; i <= maxX; i++) {
      for (let j = minY; j <= maxY; j++) {
        const key = `${i},${j}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const item of cell) {
            const dx = item.baseX - x;
            const dy = item.baseY - y;
            if (dx * dx + dy * dy <= radiusSq) {
              result.push(item);
            }
          }
        }
      }
    }
    
    return result;
  }
}
