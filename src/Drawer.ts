export class Drawer {
    private ctx: CanvasRenderingContext2D;
    private scale: number;
  
    constructor(width: number, height: number, scale: number = 10) {
      this.scale = scale;
      const canvas = document.createElement('canvas');
      canvas.width = width * this.scale;
      canvas.height = height * this.scale;
      this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      document.body.appendChild(canvas);
    }
  
    public clear():void {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
  
    public drawRectangle(x: number, y: number, color: string, size = 1):void {
      this.ctx.beginPath();
      this.ctx.fillStyle = color;
      const width = size * this.scale;
      this.ctx.fillRect(x * this.scale + ((this.scale - width) / 2), y * this.scale + ((this.scale - width) / 2), width, width);
    }
  
    public drawCircle(x: number, y: number, color: string, size = 1):void {
      this.ctx.beginPath();
      this.ctx.fillStyle = color;
      this.ctx.arc(x * this.scale + this.scale / 2, y * this.scale + this.scale / 2, (size * this.scale) / 2, 0, 2 * Math.PI);
      this.ctx.fill();
    }

    public drawDiamond(x: number, y: number, color: string, size = 1): void {
      this.ctx.beginPath();
      this.ctx.fillStyle = color;
      
      const halfSize = (size * this.scale) / 2;
      
      const topX = x * this.scale + this.scale / 2;
      const topY = y * this.scale;
      const rightX = x * this.scale + this.scale;
      const rightY = y * this.scale + halfSize;
      const bottomX = x * this.scale + this.scale / 2;
      const bottomY = y * this.scale + this.scale;
      const leftX = x * this.scale;
      const leftY = y * this.scale + halfSize;
      
      this.ctx.moveTo(topX, topY);
      this.ctx.lineTo(rightX, rightY);
      this.ctx.lineTo(bottomX, bottomY);
      this.ctx.lineTo(leftX, leftY);
      this.ctx.closePath();            
      
      this.ctx.fill();
  }
  }