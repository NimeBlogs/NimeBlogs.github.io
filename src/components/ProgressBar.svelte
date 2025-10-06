<script>
  import { onMount, onDestroy } from 'svelte';
  
  // 监听滚动事件，更新阅读进度
  let progress = 0;
  let showProgressBar = false; // 控制进度条的显示/隐藏
  let progressBarOpacity = 0; // 控制进度条的透明度动画
  
  const updateProgress = () => {
    // 获取文档总高度和可视区域高度
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    // 获取当前滚动位置
    const progressHeight = window.scrollY;
    // 计算进度百分比
    progress = (progressHeight / totalHeight) * 100;
    
    // 控制进度条的显示/隐藏：当滚动超过100px时显示，否则隐藏
    if (progressHeight > 100 && totalHeight > 0) {
      showProgressBar = true;
      setTimeout(() => {
        progressBarOpacity = 1;
      }, 50);
    } else {
      progressBarOpacity = 0;
      setTimeout(() => {
        if (progressBarOpacity === 0) {
          showProgressBar = false;
        }
      }, 300);
    }
  };
  
  // 组件挂载时添加事件监听
  onMount(() => {
    window.addEventListener('scroll', updateProgress);
    // 初始更新一次进度
    updateProgress();
    // 组件销毁时移除事件监听
    return () => window.removeEventListener('scroll', updateProgress);
  });
</script>

{#if showProgressBar}
  <!-- 主进度条容器 -->
  <div 
    class="fixed top-0 left-0 right-0 z-50 pointer-events-none select-none"
    style="opacity: {progressBarOpacity}; transition: opacity 0.3s ease-out;"
  >
    <!-- 进度条背景 -->
    <div class="h-1 bg-black/5 dark:bg-white/5 w-full"></div>
    <!-- 进度条填充 -->
    <div 
      class="fixed top-0 left-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] transition-all duration-300 ease-out"
      style="width: {progress}%; box-shadow: 0 0 10px 1px var(--primary);"
      aria-label="阅读进度"
    />
    
    <!-- 进度指示器 - 只在进度大于0且小于100时显示 -->
    {#if progress > 0 && progress < 100}
      <div 
        class="fixed top-0 w-3 h-3 rounded-full bg-[var(--primary)] shadow-lg shadow-[var(--primary)/30] border-2 border-white dark:border-gray-900 transition-all duration-300 ease-out transform -translate-x-1.5"
        style="left: {progress}%;"
      >
        <!-- 指示器内部的发光效果 -->
        <div class="absolute inset-0 rounded-full bg-[var(--primary)] opacity-60 blur-sm animate-pulse"></div>
      </div>
    {/if}
    
    <!-- 进度文本显示 - 只在进度大于20且小于90时显示 -->
    {#if progress > 20 && progress < 90}
      <div 
        class="fixed top-4 px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md text-sm font-medium text-[var(--primary)] border border-[var(--primary)]/20 shadow-md transition-all duration-300 ease-out transform -translate-x-1/2"
        style="left: {progress}%; opacity: {Math.sin(progress/100*Math.PI)*0.7 + 0.3};"
      >
        {Math.round(progress)}%
      </div>
    {/if}
  </div>
{/if}