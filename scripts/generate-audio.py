#!/usr/bin/env python3
import json
import os
import subprocess
from pathlib import Path

# 创建音频输出目录
audio_dir = Path('public/audio')
audio_dir.mkdir(parents=True, exist_ok=True)

# 读取句子数据
with open('data/sample-sentences.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sentences = data['sentences']
print(f'📝 开始生成 {len(sentences)} 条句子的音频...\n')

for sentence in sentences:
    level = sentence['level']
    seq_no = sentence['seqNo']
    en_text = sentence['enText']

    # 创建音频文件路径
    level_dir = audio_dir / f'level{level}'
    level_dir.mkdir(parents=True, exist_ok=True)

    audio_file = level_dir / f'{seq_no:03d}.mp3'

    # 使用 macOS 系统的 say 命令生成音频
    try:
        # 先生成 aiff 格式，再转换为 mp3
        aiff_file = audio_file.with_suffix('.aiff')
        subprocess.run(
            ['say', '-v', 'Alex', '-o', str(aiff_file), en_text],
            check=True,
            capture_output=True
        )

        # 转换为 mp3（需要 ffmpeg）
        subprocess.run(
            ['ffmpeg', '-i', str(aiff_file), '-q:a', '9', '-n', str(audio_file)],
            check=True,
            capture_output=True
        )

        # 删除临时 aiff 文件
        aiff_file.unlink()

        print(f'✅ Level {level}, Seq {seq_no}: {en_text}')
    except subprocess.CalledProcessError as e:
        print(f'❌ Level {level}, Seq {seq_no} 失败: {e}')
    except FileNotFoundError:
        print(f'❌ 需要安装 ffmpeg: brew install ffmpeg')
        break

print('\n✨ 音频生成完成！')
print(f'📁 音频文件位置: {audio_dir}')
