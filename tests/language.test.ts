import { describe, it, expect } from 'vitest';
import { detectLanguage, detectLanguageWithStats, LanguageCode } from '../src/lib/language';

describe('detectLanguage', () => {
  it('detects empty and blank text as Hindi fallback', () => {
    expect(detectLanguage('')).toBe('hi');
    expect(detectLanguage('   ')).toBe('hi');
  });

  it.each([
    ['मेरा नाम राहुल है और मुझे घर का किराया वापस चाहिए।', 'hi'],
    ['जमीन का विवाद है, कृपया मुझे कानूनी सलाह दीजिए।', 'hi'],
    ['मैंने संपत्ति खरीदी थी लेकिन कागजात नहीं मिले।', 'hi'],
    ['हमारा तलाक हो रहा है और बच्चों की कस्टडी चाहिए।', 'hi'],
    ['पुलिस ने मेरी शिकायत दर्ज नहीं की, क्या करूं?', 'hi'],
  ])('detects Hindi Devanagari text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['I need legal help to file a consumer complaint against my bank.', 'en'],
    ['The police refused to register my FIR, what should I do?', 'en'],
    ['My landlord is not returning my security deposit money.', 'en'],
    ['Please help me understand the rental agreement terms.', 'en'],
    ['We bought a plot but the builder did not transfer ownership.', 'en'],
  ])('detects English text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['mujhe property dispute ka case lena hai, please batao kya karna chahiye', 'hinglish'],
    ['mera landlord deposit nahi de raha hai, what is the law?', 'hinglish'],
    ['police ne meri complaint nahi maani sir, kya karu?', 'hinglish'],
    ['mujhe divorce ke liye advocate chahiye, kaise milega?', 'hinglish'],
    ['yeh consumer court ka complaint kaise file karein?', 'hinglish'],
  ])('detects Hinglish text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['என் வீட்டு வாடகை பணத்தை திருப்பி தரவில்லை.', 'ta'],
    ['நான் ஒரு நில வழக்கில் ஆலோசனை வேண்டும்.', 'ta'],
    ['என் கணவர் விவாகரத்து கேட்கிறார்.', 'ta'],
    ['மருத்துவக் காப்பீடு கோரிக்கை ஏற்கப்படவில்லை.', 'ta'],
    ['நிலம் வாங்கியதற்கான பத்திரங்கள் என்னிடம் இல்லை.', 'ta'],
  ])('detects Tamil text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['నా ఇంటి అద్దె డబ్బు తిరిగి ఇవ్వడం లేదు.', 'te'],
    ['నాకు భూమి వివాదంలో సలహా కావాలి.', 'te'],
    ['మా విడాకుల కేసు కోర్టులో ఉంది.', 'te'],
    ['ప్రొపర్టీ పత్రాలు నా దగ్గర లేవు.', 'te'],
    ['కన్స్యూమర్ ఫిర్యాదు ఎలా దాఖలు చేయాలి?', 'te'],
  ])('detects Telugu text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['आहे तर पोलीस तक्रार दाखल करा.', 'mr'],
    ['माझी जमीन वाद आहे, कृपया सल्ला द्या.', 'mr'],
    ['आमचा घटस्फोट झाला आहे आणि मुलांची ताबा हवी आहे.', 'mr'],
    ['बँकेकडून पैसे परत मिळत नाहीत.', 'mr'],
    ['तुम्ही इथे नको पण न्यायालयात जा.', 'mr'],
  ])('detects Marathi text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['আমার বাড়ির ভাড়ার টাকা ফেরত পাচ্ছি না।', 'bn'],
    ['আমার জমি বিবাদে পরামর্শ দরকার।', 'bn'],
    ['আমাদের বিবাহ বিচ্ছেদ মামলা আদালতে আছে।', 'bn'],
    ['জমির দলিল আমার কাছে নেই।', 'bn'],
    ['কনজ্যুমার অভিযোগ কীভাবে দায়ের করব?', 'bn'],
  ])('detects Bengali text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['ನನ್ನ ಮನೆಯ ಬಾಡಿಗೆ ಹಣ ಮರುಪಡೆಯಲು ಸಹಾಯ ಬೇಕು.', 'kn'],
    ['ನನಗೆ ಭೂಮಿ ವಿವಾದದಲ್ಲಿ ಸಲಹೆ ಬೇಕು.', 'kn'],
    ['ನಮ್ಮ ವಿಚ್ಛೇದನ ಪ್ರಕರಣ ನ್ಯಾಯಾಲಯದಲ್ಲಿದೆ.', 'kn'],
    ['ಭೂಮಿ ದಾಖಲೆಗಳು ನನ್ನ ಬಳಿ ಇಲ್ಲ.', 'kn'],
    ['ಗ್ರಾಹಕ ದೂರನ್ನು ಹೇಗೆ ದಾಖಲಿಸುವುದು?', 'kn'],
  ])('detects Kannada text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it.each([
    ['મારા ઘરનું ભાડું પરત મળતું નથી.', 'gu'],
    ['મને જમીન વિવાદમાં સલાહ જોઈએ છે.', 'gu'],
    ['અમારો છૂટાછેડા કેસ કોર્ટમાં છે.', 'gu'],
    ['જમીનના દસ્તાવેજ મારી પાસે નથી.', 'gu'],
    ['ગ્રાહક ફરિયાદ કેવી રીતે દાખલ કરવી?', 'gu'],
  ])('detects Gujarati text %#', (text, expected) => {
    expect(detectLanguage(text)).toBe(expected);
  });

  it('detects Devanagari with no Marathi markers as Hindi', () => {
    expect(detectLanguage('मुझे वकील चाहिए')).toBe('hi');
  });
});

describe('detectLanguageWithStats', () => {
  it('returns hi with 0 confidence for empty text', () => {
    const stats = detectLanguageWithStats('');
    expect(stats.language).toBe('hi');
    expect(stats.confidence).toBe(0);
  });

  it('reports a sensible script label for Tamil text', () => {
    const stats = detectLanguageWithStats('என் வீட்டு வாடகை பணத்தை திருப்பி தரவில்லை.');
    expect(stats.script).toBe('Tamil');
  });

  it('reports Latin script for English/Hinglish text', () => {
    expect(detectLanguageWithStats('I need legal help.').script).toBe('Latin');
    expect(detectLanguageWithStats('mujhe legal help chahiye').script).toBe('Latin');
  });

  it('reports Devanagari script for Hindi text', () => {
    expect(detectLanguageWithStats('मुझे वकील चाहिए').script).toBe('Devanagari');
  });

  it('clamps confidence between 0 and 1', () => {
    const stats = detectLanguageWithStats('मैं अपना घर लेकर नहीं जा सकता');
    expect(stats.confidence).toBeGreaterThanOrEqual(0);
    expect(stats.confidence).toBeLessThanOrEqual(1);
  });
});