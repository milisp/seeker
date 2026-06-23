import AtlasCloudIcon from '@/assets/atlascloud.svg';
import OpenAIIcon from '@/assets/openai.svg';
import DeepSeekIcon from '@/assets/deepseek-color.svg';
import OpenRouterIcon from '@/assets/openrouter.svg';
import OllamaIcon from '@/assets/ollama.svg';
import NvidiaIcon from '@/assets/nvidia-color.svg';

export function ProviderIcons({ providerId, size = 'md' }: { providerId: string, size?: 'sm' | 'md' | 'lg' }) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-6 w-6';
      case 'lg': return 'h-8 w-8';
    }
  };

  return (
    <div className={`${getSizeClass()} flex items-center justify-center`}>
      {providerId === 'atlascloud' && <img src={AtlasCloudIcon} />}
      {providerId === 'openai' && <img src={OpenAIIcon} />}
      {providerId === 'deepseek' && <img src={DeepSeekIcon} />}
      {providerId === 'openrouter' && <img src={OpenRouterIcon} />}
      {providerId === 'ollama' && <img src={OllamaIcon} />}
      {providerId === 'nvidia' && <img src={NvidiaIcon} />}
    </div>
  );
}