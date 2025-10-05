<script lang="ts">
  // 粒子背景组件
  import { onMount, onDestroy } from 'svelte';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let particles: Particle[] = [];
  let animationId: number;
  let mouse = { x: 0, y: 0 };
  let isMouseMoving = false;
  let mouseMoveTimeout: number;

  // 粒子配置
  const config = {
    particleCount: 60, // 初始粒子数量
    maxParticleCount: 120, // 最大粒子数量
    particleSize: 2,
    particleSpeed: 0.8,
    lineDistance: 100,
    lineWidth: 1,
    mouseAttractionRadius: 150, // 增大吸附范围
    mouseAttractionStrength: 5.0, // 增强吸附强度
    mouseConnectedAttractionStrength: 3.5, // 已连接粒子的吸附强度
    mouseMinDistance: 60, // 粒子与鼠标的最小距离
    mouseLineDistance: 100, // 鼠标与粒子连线的触发距离
    mouseBreakDistance: 150, // 鼠标与粒子断开连接的距离
    mouseMoveTimeout: 2500, // 鼠标停止移动后保持吸附的时间(ms)
    particleMinDistance: 30, // 粒子之间的最小距离
    particleRepulsionStrength: 1.5, // 粒子之间的排斥强度
    // 边缘生成粒子的配置
    spawnFromEdge: true, // 是否从边缘生成粒子
    spawnRate: 50, // 生成粒子的间隔帧数
    spawnCount: 2, // 每次生成的粒子数量
    // 线条颜色配置
    particleLineColor: 'rgba(0, 0, 0, 0.1)', // 粒子间连线基础颜色
    mouseLineColor: 'rgba(0, 120, 0, 0.2)', // 鼠标连线基础颜色
  };

  // 获取主题颜色
  const getThemeColor = () => {
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim();
    return { primaryColor, secondaryColor };
  };

  // 解析颜色值为RGB分量
  const parseColor = (color: string): { r: number; g: number; b: number } => {
    if (color.startsWith('#')) {
      // 处理十六进制颜色
      const hex = color.replace('#', '');
      const bigint = parseInt(hex, 16);
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
      };
    } else if (color.startsWith('rgb')) {
      // 处理rgb/rgba颜色
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        return {
          r: parseInt(match[0]),
          g: parseInt(match[1]),
          b: parseInt(match[2])
        };
      }
    }
    // 默认返回黑色
    return { r: 0, g: 0, b: 0 };
  };

  // 混合两种颜色
  const mixColors = (color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }, ratio: number): string => {
    const r = Math.round(color1.r * (1 - ratio) + color2.r * ratio);
    const g = Math.round(color1.g * (1 - ratio) + color2.g * ratio);
    const b = Math.round(color1.b * (1 - ratio) + color2.b * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // 粒子类
  class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    isConnectedToMouse: boolean; // 标记粒子是否与鼠标连接
    lastDistanceToMouse: number; // 上次与鼠标的距离，用于平滑效果

    constructor(spawnFromEdge: boolean = false) {
      if (spawnFromEdge) {
        // 从边缘生成粒子
        const edge = Math.floor(Math.random() * 4); // 0: 上边, 1: 右边, 2: 下边, 3: 左边
        switch (edge) {
          case 0: // 上边
            this.x = Math.random() * window.innerWidth;
            this.y = -config.particleSize;
            this.speedX = (Math.random() - 0.5) * config.particleSpeed;
            this.speedY = Math.random() * config.particleSpeed;
            break;
          case 1: // 右边
            this.x = window.innerWidth + config.particleSize;
            this.y = Math.random() * window.innerHeight;
            this.speedX = -Math.random() * config.particleSpeed;
            this.speedY = (Math.random() - 0.5) * config.particleSpeed;
            break;
          case 2: // 下边
            this.x = Math.random() * window.innerWidth;
            this.y = window.innerHeight + config.particleSize;
            this.speedX = (Math.random() - 0.5) * config.particleSpeed;
            this.speedY = -Math.random() * config.particleSpeed;
            break;
          case 3: // 左边
            this.x = -config.particleSize;
            this.y = Math.random() * window.innerHeight;
            this.speedX = Math.random() * config.particleSpeed;
            this.speedY = (Math.random() - 0.5) * config.particleSpeed;
            break;
        }
      } else {
        // 随机分布在整个画布上
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.speedX = (Math.random() - 0.5) * config.particleSpeed;
        this.speedY = (Math.random() - 0.5) * config.particleSpeed;
      }
      this.size = config.particleSize;
      this.color = getComputedStyle(document.documentElement).getPropertyValue('--primary');
      this.isConnectedToMouse = false;
      this.lastDistanceToMouse = 0;
    }

    update() {
      // 移动粒子
      this.x += this.speedX;
      this.y += this.speedY;

      // 边界检测 - 简单反弹
      if (this.x < 0 || this.x > window.innerWidth) this.speedX *= -1;
      if (this.y < 0 || this.y > window.innerHeight) this.speedY *= -1;

      // 确保粒子不会完全离开画布
      this.x = Math.max(0, Math.min(window.innerWidth, this.x));
      this.y = Math.max(0, Math.min(window.innerHeight, this.y));

      // 粒子间排斥效果
      for (let i = 0; i < particles.length; i++) {
        const otherParticle = particles[i];
        if (otherParticle === this) continue;

        const dx = this.x - otherParticle.x;
        const dy = this.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果粒子距离小于最小距离，应用排斥力
        if (distance < config.particleMinDistance && distance > 0) {
          // 非线性排斥力：越近排斥力越强
          const normalizedDistance = distance / config.particleMinDistance;
          const forceFactor = (1 - normalizedDistance) * config.particleRepulsionStrength;
          
          this.x += (dx / distance) * forceFactor;
          this.y += (dy / distance) * forceFactor;
        }
      }

      // 鼠标吸引效果
      if (isMouseMoving) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.lastDistanceToMouse = distance;

        // 确定吸附力的强度和计算方式
        let attractionStrength = config.mouseAttractionStrength;
        let forceFactor = 0;

        if (this.isConnectedToMouse) {
          // 已连接的粒子有更强的吸附力
          attractionStrength = config.mouseConnectedAttractionStrength;
          // 已连接的粒子吸附范围更大
          if (distance < config.mouseBreakDistance && distance > config.mouseMinDistance) {
            // 非线性力场：越近吸引力越强
            const normalizedDistance = (distance - config.mouseMinDistance) / (config.mouseBreakDistance - config.mouseMinDistance);
            forceFactor = 1 - normalizedDistance * normalizedDistance; // 平方衰减
          }
        } else {
          // 普通吸附范围
          if (distance < config.mouseAttractionRadius && distance > config.mouseMinDistance) {
            const normalizedDistance = (distance - config.mouseMinDistance) / (config.mouseAttractionRadius - config.mouseMinDistance);
            forceFactor = 1 - normalizedDistance * normalizedDistance; // 平方衰减
          }
        }

        // 应用吸附力
        if (forceFactor > 0) {
          this.x += (dx / distance) * forceFactor * attractionStrength;
          this.y += (dy / distance) * forceFactor * attractionStrength;
        }
      }
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 连接粒子的函数
  function connectParticles() {
    const { primaryColor, secondaryColor } = getThemeColor();
    const primaryRGB = parseColor(primaryColor);
    const secondaryRGB = parseColor(secondaryColor);

    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.lineDistance) {
          const opacity = 1 - distance / config.lineDistance;
          
          // 基于距离混合两种主题色
          const colorRatio = 0.5 + (Math.sin(distance * 0.05) * 0.3); // 添加一些变化
          const mixedColor = mixColors(primaryRGB, secondaryRGB, colorRatio);
          
          // 设置线条样式，透明度随距离变化
          ctx.strokeStyle = `rgba(${mixedColor.substring(4, mixedColor.length - 1)}, ${opacity * 0.7})`;
          ctx.lineWidth = config.lineWidth * opacity;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  }

  // 连接鼠标和粒子的函数
  function connectMouseToParticles() {
    if (!isMouseMoving) return;
    
    const { primaryColor } = getThemeColor();
    const primaryRGB = parseColor(primaryColor);
    const accentRGB = parseColor('#4a6cf7'); // 作为鼠标连线的强调色
    
    particles.forEach(particle => {
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 如果粒子已经与鼠标连接，或者距离小于连接距离
      if ((particle.isConnectedToMouse && distance < config.mouseBreakDistance) || distance < config.mouseLineDistance) {
        // 如果距离小于连接距离，标记为连接
        if (distance < config.mouseLineDistance) {
          particle.isConnectedToMouse = true;
        }
        // 绘制连线
        const maxDistance = particle.isConnectedToMouse ? config.mouseBreakDistance : config.mouseLineDistance;
        const opacity = 1 - distance / maxDistance;
        
        // 基于距离混合主题色和强调色
        const colorRatio = 1 - distance / maxDistance; // 越近越偏向强调色
        const mixedColor = mixColors(primaryRGB, accentRGB, colorRatio);
        
        // 设置线条样式
        ctx.strokeStyle = `rgba(${mixedColor.substring(4, mixedColor.length - 1)}, ${opacity * 0.8})`;
        ctx.lineWidth = config.lineWidth * opacity * 1.2; // 鼠标连线稍微粗一点
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(particle.x, particle.y);
        ctx.stroke();
      } else {
        // 距离超过断开距离，标记为断开连接
        particle.isConnectedToMouse = false;
      }
    });
  }

  // 从边缘生成粒子的函数
  let frameCount = 0;
  function spawnParticlesFromEdge() {
    if (!config.spawnFromEdge) return;

    frameCount++;
    if (frameCount % config.spawnRate === 0) {
      // 检查是否超过最大粒子数量
      if (particles.length < config.maxParticleCount) {
        // 生成指定数量的粒子
        for (let i = 0; i < config.spawnCount; i++) {
          particles.push(new Particle(true));
        }
      }
    }
  }

  // 动画循环
  function animate() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    connectParticles();
    connectMouseToParticles(); // 添加鼠标与粒子的连线
    spawnParticlesFromEdge(); // 从边缘生成粒子
    animationId = requestAnimationFrame(animate);
  }

  // 初始化函数
  function init() {
    if (!canvas) return;
    
    // 设置canvas尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext('2d')!;

    // 重置帧计数
    frameCount = 0;

    // 创建粒子
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      particles.push(new Particle());
    }

    // 开始动画
    animate();
  }

  // 鼠标移动事件处理
  function handleMouseMove(event: MouseEvent) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    isMouseMoving = true;

    // 鼠标停止移动后关闭吸引效果
    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = window.setTimeout(() => {
      isMouseMoving = false;
      // 鼠标停止移动后，断开所有粒子的连接
      particles.forEach(particle => {
        particle.isConnectedToMouse = false;
      });
    }, config.mouseMoveTimeout);
  }

  // 窗口大小变化处理
  function handleResize() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // 生命周期钩子
  onMount(() => {
    init();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
    clearTimeout(mouseMoveTimeout);
  });
</script>

<canvas 
  bind:this={canvas} 
  class="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none"
></canvas>