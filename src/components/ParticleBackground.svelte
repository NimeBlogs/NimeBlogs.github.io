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
    particleCount: 50, // 增加粒子数量
    maxParticleCount: 80, // 增加最大粒子数量
    particleSize: 1,
    particleSpeed: 1, // 略微调整速度
    lineDistance: 120, // 增加连线距离
    lineWidth: 1,
    mouseAttractionRadius: 150, // 增大吸附范围
    mouseRadius: 80, // 增大吸附范围
    mouseAttractionStrength: 5.0, // 增强吸附强度
    mouseConnectedAttractionStrength: 3.5, // 已连接粒子的吸附强度
    mouseMinDistance: 60, // 粒子与鼠标的最小距离
    mouseLineDistance: 180, // 增加鼠标连线距离
    mouseBreakDistance: 150, // 鼠标与粒子断开连接的距离
    mouseMoveTimeout: 2500, // 鼠标停止移动后保持吸附的时间(ms)
    particleMinDistance: 50, // 粒子之间的最小距离
    particleRepulsionStrength: 1.65, // 粒子之间的排斥强度
    // 边缘生成粒子的配置
    spawnFromEdge: true, // 是否从边缘生成粒子
    spawnRate: 50, // 生成粒子的间隔帧数
    spawnCount: 2, // 每次生成的粒子数量
    // 线条颜色配置 - 为黑暗模式优化
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
    colorIndex: number; // 颜色索引，用于优化连线颜色
    isConnectedToMouse: boolean; // 标记粒子是否与鼠标连接
    lastDistanceToMouse: number; // 上次与鼠标的距离，用于平滑效果
    
    // 萤火虫效果相关属性
    flickerPhase: number; // 当前闪烁阶段
    flickerSpeed: number; // 闪烁速度
    flickerAmplitude: number; // 闪烁振幅
    baseOpacity: number; // 基础透明度
    haloIntensity: number; // 光晕强度
    glowSize: number; // 发光大小

    constructor(spawnFromEdge: boolean = false) {
      // 粒子颜色数组，为黑暗模式优化
      // 萤火虫效果使用黄绿色调
      const isDarkMode = document.documentElement.classList.contains('dark');
      const particleColors = isDarkMode 
        ? ['#FFFFAA', '#FFFF88', '#CCFFAA', '#AAFF88', '#FFFFCC'] // 更明亮的萤火虫黄绿色系列
        : ['#4a5568', '#718096', '#a0aec0'];
      
      this.colorIndex = Math.floor(Math.random() * particleColors.length);
      
      // 初始化萤火虫效果相关属性
      this.flickerPhase = Math.random() * Math.PI * 2; // 随机初始相位
      this.flickerSpeed = 0.02 + Math.random() * 0.03; // 随机闪烁速度
      this.flickerAmplitude = 0.5 + Math.random() * 0.4; // 降低闪烁幅度，使光晕更稳定
      this.baseOpacity = 0.2 + Math.random() * 0.1; // 降低基础透明度
      this.haloIntensity = 0.5 + Math.random() * 0.25; // 降低光晕强度
      this.glowSize = 1.0 + Math.random() * 0.4; // 发光大小的变化因子
      
      if (spawnFromEdge) {
        // 从边缘生成粒子
        const edge = Math.floor(Math.random() * 4); // 0: 上边, 1: 右边, 2: 下边, 3: 左边
        switch (edge) {
          case 0: // 上边
            this.x = Math.random() * window.innerWidth;
            this.y = -30;
            this.speedX = (Math.random() - 0.5) * config.particleSpeed;
            this.speedY = Math.random() * config.particleSpeed;
            break;
          case 1: // 右边
            this.x = window.innerWidth + 30;
            this.y = Math.random() * window.innerHeight;
            this.speedX = -Math.random() * config.particleSpeed;
            this.speedY = (Math.random() - 0.5) * config.particleSpeed;
            break;
          case 2: // 下边
            this.x = Math.random() * window.innerWidth;
            this.y = window.innerHeight + 30;
            this.speedX = (Math.random() - 0.5) * config.particleSpeed;
            this.speedY = -Math.random() * config.particleSpeed;
            break;
          case 3: // 左边
            this.x = -30;
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
      this.color = particleColors[this.colorIndex];
      this.isConnectedToMouse = false;
      this.lastDistanceToMouse = 0;
    }

    update() {
      // 移动粒子
      this.x += this.speedX;
      this.y += this.speedY;

      // 边界检测 - 简单反弹
      if (this.x < -50 || this.x > window.innerWidth + 50) this.speedX *= -1;
      if (this.y < -50 || this.y > window.innerHeight + 50) this.speedY *= -1;

      // 确保粒子不会完全离开画布
      this.x = Math.max(-50, Math.min(window.innerWidth + 50, this.x));
      this.y = Math.max(-50, Math.min(window.innerHeight + 50, this.y));

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

      // 更新萤火虫闪烁效果
      this.flickerPhase += this.flickerSpeed;

      // 鼠标交互效果
      if (isMouseMoving) {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.lastDistanceToMouse = distance;

        // 黑暗模式下：鼠标排斥效果（惊扰萤火虫）
        if (isDarkMode) {
          // 当鼠标移动且距离在排斥范围内时，粒子远离鼠标
          if (distance < config.mouseRadius && distance > 0) {
            // 非线性力场：越近排斥力越强
            const normalizedDistance = distance / config.mouseRadius;
            const forceFactor = (1 - normalizedDistance) * 1.2; // 排斥力因子
            
            // 应用排斥力（与吸引方向相反）
            this.x -= (dx / distance) * forceFactor * config.mouseAttractionStrength;
            this.y -= (dy / distance) * forceFactor * config.mouseAttractionStrength;
          }
          
          // 黑暗模式下不连接鼠标
          this.isConnectedToMouse = false;
        } else {
          // 正常模式下：保持原有吸引效果
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
    }

    draw() {
      // 检测是否为黑暗模式
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      // 绘制粒子光晕效果 - 增强发光效果
      // 第一层光晕：增强大小和强度
      const haloSize = isDarkMode ? this.size * 3 * this.glowSize : this.size * 1 * this.glowSize;
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, haloSize
      );
      
      if (isDarkMode) {
        // 萤火虫效果：计算闪烁透明度
        const flickerOpacity = this.baseOpacity + Math.sin(this.flickerPhase) * this.flickerAmplitude;
        
        // 调整粒子颜色的透明度，使其更符合萤火虫的发光效果
        const colorWithAlpha = this.color.replace(')', `, ${flickerOpacity * this.haloIntensity})`).replace('rgb', 'rgba');
        
        // 创建更柔和的萤火虫光晕效果 - 增加更多渐变层次
        gradient.addColorStop(0, colorWithAlpha);
        gradient.addColorStop(0.1, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.2})`).replace('rgb', 'rgba'));
        gradient.addColorStop(0.2, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.8})`).replace('rgb', 'rgba'));
        gradient.addColorStop(0.3, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.5})`).replace('rgb', 'rgba'));
        gradient.addColorStop(0.4, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.2})`).replace('rgb', 'rgba'));
        gradient.addColorStop(0.5, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.2})`).replace('rgb', 'rgba'));
        gradient.addColorStop(0.6, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.2})`).replace('rgb', 'rgba'));
        gradient.addColorStop(0.7, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.2})`).replace('rgb', 'rgba'));
        gradient.addColorStop(0.8, 'transparent');
        
        // 绘制粒子主体，应用闪烁效果
        ctx.fillStyle = this.color;
        ctx.globalAlpha = flickerOpacity * this.haloIntensity; // 应用闪烁透明度，增强亮度
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // 稍微增大粒子主体
        ctx.fill();
        ctx.globalAlpha = 0.85; // 重置透明度
        
        // 添加第二层更柔和、更大的光晕，增强发光效果
        const outerGlowSize = haloSize * 3;
        const outerGradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, outerGlowSize
        );
        outerGradient.addColorStop(0, 'transparent');
        outerGradient.addColorStop(0.25, this.color.replace(')', `, ${flickerOpacity * this.haloIntensity * 0.05})`).replace('rgb', 'rgba')); // 降低外层光晕透明度
        outerGradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, outerGlowSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 正常模式保持原有设置
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        // 正常模式增强光晕效果
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, haloSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 连接粒子的函数
  function connectParticles() {
    // 黑暗模式下不连接鼠标与粒子
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode || !isMouseMoving) return;
    const { primaryColor, secondaryColor } = getThemeColor();
    const primaryRGB = parseColor(primaryColor);
    const secondaryRGB = parseColor(secondaryColor);

    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.lineDistance) {
          const opacity = 1 - distance / config.lineDistance;
          
          // 基于距离混合两种主题色
          const colorRatio = 0.5 + (Math.sin(distance * 0.05) * 0.3); // 添加一些变化
          const mixedColor = mixColors(primaryRGB, secondaryRGB, colorRatio);
          
          // 设置线条样式，透明度随距离变化，增加连线粗细变化
          ctx.strokeStyle = `rgba(${mixedColor.substring(4, mixedColor.length - 1)}, ${opacity * 0.7})`;
          ctx.lineWidth = config.lineWidth * opacity + (opacity * 0.5);
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
    // 黑暗模式下不连接鼠标与粒子
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (isDarkMode || !isMouseMoving) return;
    
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

  let themeObserver: MutationObserver | null = null;
  
  // 更新所有现有粒子颜色的函数
  function updateParticlesColors() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    // 萤火虫效果使用黄绿色调
    const particleColors = isDarkMode 
      ? ['#FFFFAA', '#FFFF88', '#CCFFAA', '#AAFF88', '#FFFFCC'] // 更明亮的萤火虫黄绿色系列
      : ['#4a5568', '#718096', '#a0aec0']; // 正常模式下的颜色
    
    // 更新每个粒子的颜色和萤火虫效果属性
    particles.forEach(particle => {
      // 为了保持一些随机性但确保颜色变化，随机选择新颜色数组中的一个颜色
      const newColorIndex = Math.floor(Math.random() * particleColors.length);
      particle.color = particleColors[newColorIndex];
      
      // 如果是黑暗模式，重新随机化萤火虫效果属性
      if (isDarkMode) {
        particle.flickerPhase = Math.random() * Math.PI * 2; // 随机初始相位
        particle.flickerSpeed = 0.02 + Math.random() * 0.03; // 随机闪烁速度
        particle.flickerAmplitude = 0.2 + Math.random() * 0.1; // 降低闪烁幅度，使光晕更稳定
        particle.baseOpacity = 0.5 + Math.random() * 0.2; // 降低基础透明度
        particle.haloIntensity = 0.5 + Math.random() * 0.2; // 降低光晕强度
        particle.glowSize = 1.0 + Math.random() * 0.5; // 发光大小的变化因子
      } else {
        // 正常模式也保持一些变化
        particle.glowSize = 1.0 + Math.random() * 0.5;
      }
    });
  }

  // 生命周期钩子
  onMount(() => {
    init();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    // 添加对黑暗模式切换的监听
    themeObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          updateParticlesColors();
        }
      });
    });
    
    themeObserver.observe(document.documentElement, {
      attributes: true
    });
  });
  
  onDestroy(() => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      // 清理主题观察者
      if (themeObserver) {
        themeObserver.disconnect();
      }
      
      // 清理动画和超时
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      clearTimeout(mouseMoveTimeout);
    });
</script>

<canvas 
  bind:this={canvas} 
  class="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none"
></canvas>