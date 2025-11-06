import google.generativeai as genai
genai.configure(api_key="AIzaSyAyuaCpLERbQjI-YSlWEg6aOXYcxqPBz-M")

for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
