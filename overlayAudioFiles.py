import sys
from pydub import AudioSegment
import json


data = json.load(open(sys.argv[1]))
initial_file = AudioSegment.from_file(data.pop(0)['filePath'], 'ogg')
for item in data:
    overlay_file = AudioSegment.from_file(item['filePath'], 'ogg')
    silent = AudioSegment.silent(duration=item['startTime'])
    overlay = silent.append(overlay_file)
    duration = overlay.duration_seconds - initial_file.duration_seconds
    if duration > 0:
        silent_2 = AudioSegment.silent(duration=round(duration*1000))
        initial_file = initial_file.append(silent_2)
    initial_file = initial_file.overlay(overlay_file, position=0)
initial_file += 10
initial_file.export(f'finalOutput/{sys.argv[2]}.mp3', format='mp3')
print('success')