import os
from PIL import Image, ImageDraw, ImageFont
import random

def create_banner():
    # Dimensions
    width = 930
    height = 300
    
    # Create image
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # Draw plexus/network effect (subtle background)
    # Using random seed to be consistent
    random.seed(42)
    num_dots = 50
    dots = [(random.randint(0, width), random.randint(0, height)) for _ in range(num_dots)]
    
    # Draw lines between close dots
    for i, p1 in enumerate(dots):
        for p2 in dots[i+1:]:
            dist = ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)**0.5
            if dist < 150:
                opacity = int(180 * (1 - dist/150))
                # Soft grey lines
                draw.line([p1, p2], fill=(230, 230, 230), width=1)
    
    # Draw dots with orange glow
    for x, y in dots:
        draw.ellipse([x-2, y-2, x+2, y+2], fill=(255, 165, 0)) # Orange dots
        
    # Load fonts
    font_path = "C:\\Windows\\Fonts\\segoeui.ttf"
    font_bold_path = "C:\\Windows\\Fonts\\segoeuib.ttf"
    
    try:
        font_main = ImageFont.truetype(font_bold_path, 42) # Bold
        font_sub1 = ImageFont.truetype(font_path, 28)  # Regular
        font_sub2 = ImageFont.truetype(font_path, 20)  # Regular
    except:
        font_main = ImageFont.load_default()
        font_sub1 = ImageFont.load_default()
        font_sub2 = ImageFont.load_default()
        
    # Text content
    text1 = "Tired of messy paperwork and spreadsheets?"
    text2 = "Finally, see exactly where your business stands."
    text3 = "Manage everything in one easy place – even from your phone."
    
    # Calculate positions
    def get_text_pos(text, font, y_pos):
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0]
        return ((width-w)//2, y_pos)

    draw.text(get_text_pos(text1, font_main, 60), text1, font=font_main, fill=(33, 33, 33)) # Dark grey
    draw.text(get_text_pos(text2, font_sub1, 130), text2, font=font_sub1, fill=(255, 87, 34)) # Orange-Red
    draw.text(get_text_pos(text3, font_sub2, 190), text3, font=font_sub2, fill=(80, 80, 80)) # Grey
    
    # Save image
    output_path = "d:\\MindForge\\mindforge_banner_930x300.png"
    image.save(output_path)
    print(f"Banner saved to: {output_path}")

if __name__ == "__main__":
    create_banner()
