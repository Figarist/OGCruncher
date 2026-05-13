import os
import shutil
import tempfile
from pathlib import Path
from pydub import AudioSegment
import numpy as np

BIT_DEPTH = 8
SAMPLE_RATE = 22050
QUALITY_OGG = 0  
INCLUDE_OGG = True 

def apply_bitcrush_effect(audio, bit_depth=6, sample_rate=None, force_mono=True, mario_mode=True):
    try:
        original_rate = audio.frame_rate
        if force_mono and audio.channels > 1:
            audio = audio.set_channels(1)
            
        if sample_rate and sample_rate < original_rate:
            audio = audio.set_frame_rate(sample_rate)

        samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
        if len(samples) == 0: return audio

        # 1. DC Offset Removal (Центрування хвилі)
        samples = samples - np.mean(samples)

        # 2. Початкова нормалізація
        samples = samples / (np.max(np.abs(samples)) + 1e-9)

        if mario_mode:
            # 3. SOFT EXPANDER (Тепер ДО квантування!)
            # Тихі звуки плавно стають ще тихішими, щоб квантизатор їх "з'їв"
            samples = np.sign(samples) * (np.abs(samples) ** 1.15) # Трохи м'якше, ніж 1.2

            # 4. TRIANGULAR DITHER
            err_range = 1.0 / (2 ** bit_depth)
            dither = np.random.triangular(-err_range, 0, err_range, len(samples))
            samples = samples + dither

            # 5. КВАНТУВАННЯ
            levels = 2 ** bit_depth
            samples = np.round(samples * (levels / 2)) / (levels / 2)

            # 6. НАДШВИДКИЙ ANTI-ALIASING (Zero-allocation style)
            # Векторизоване усереднення сусідніх семплів замість повільного np.convolve
            samples[1:] = (samples[1:] + samples[:-1]) * 0.5

        # 7. ПІДНЯТТЯ ГУЧНОСТІ ТА SOFT CLIP
        # М'який перегруз (Saturation), що ідеально звучить на маленьких динаміках
        samples = samples * 1.5
        samples = np.tanh(samples) * 32000.0

        # Конвертація в байти
        raw_data = samples.astype(np.int16).tobytes()
        frame_size = audio.channels * 2
        safe_length = (len(raw_data) // frame_size) * frame_size
        raw_data = raw_data[:safe_length]

        new_audio = AudioSegment(data=raw_data, sample_width=2, frame_rate=audio.frame_rate, channels=audio.channels)
        
        if new_audio.frame_rate != original_rate:
            new_audio = new_audio.set_frame_rate(original_rate)

        return new_audio
    except Exception as e:
        print(f"⚠️ Помилка обробки: {e}")
        return audio

def process_file(filepath):
    try:
        filepath = Path(filepath)
        # Визначаємо ім'я вихідного файлу
        target_path = filepath.with_suffix('.ogg')
        
        # Якщо файл вже ogg або такий файл існує - додаємо _copy
        if target_path.exists() or filepath.suffix.lower() == '.ogg':
            target_path = filepath.parent / f"{filepath.stem}_copy.ogg"

        audio = AudioSegment.from_file(filepath)
        audio = apply_bitcrush_effect(audio, BIT_DEPTH, SAMPLE_RATE)

        temp_fd, temp_path = tempfile.mkstemp(suffix='.ogg')
        os.close(temp_fd)

        audio.export(temp_path, format='ogg', codec='libvorbis', parameters=['-q:a', str(QUALITY_OGG)])
        
        shutil.move(temp_path, target_path)
        print(f"✅ Готово: {target_path.name}")
        return True
    except Exception as e:
        print(f"❌ Помилка: {filepath.name} -> {e}")
        return False

def main():
    # Отримуємо шлях до папки, де лежить скрипт
    current_dir = Path(__file__).parent.absolute()
    print(f"🔍 Сканування папки: {current_dir}")
    
    audio_exts = {'.wav', '.mp3', '.flac', '.aiff', '.aif', '.ogg'}
    
    # Знаходимо всі аудіо файли
    files_to_process = []
    for file in os.listdir(current_dir):
        f_path = current_dir / file
        if f_path.is_file() and f_path.suffix.lower() in audio_exts:
            # Не обробляємо самі файли з суфіксом _copy, щоб не зациклитись
            if "_copy" not in f_path.name:
                files_to_process.append(f_path) 

    if not files_to_process:
        print("🤷 Файлів не знайдено.")
        return

    print(f"🚀 Починаємо обробку {len(files_to_process)} файлів...")
    for f in files_to_process:
        process_file(f)
    
    print("\n✨ Всі файли оброблені!")
    input("Натисніть Enter, щоб закрити...") # Щоб консоль не закрилась миттєво

if __name__ == '__main__':
    main()