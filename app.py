from flask import Flask, request, jsonify, render_template
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

model_name = "microsoft/DialoGPT-medium"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/chat", methods=["POST"])
def chat():
    user_input = request.get_json().get("query", "").strip()
    if not user_input:
        return jsonify({"response": "Say something first bruh"})

    input_ids = tokenizer.encode(user_input + tokenizer.eos_token, return_tensors="pt")

    try:
        response_ids = model.generate(
            input_ids,
            max_length=1000,
            pad_token_id=tokenizer.eos_token_id,
            do_sample=True,
            top_k=50,
            top_p=0.95,
            temperature=0.75
        )

        output = tokenizer.decode(response_ids[:, input_ids.shape[-1]:][0], skip_special_tokens=True).strip()
        return jsonify({"response": output})

    except Exception as e:
        return jsonify({"response": "brain fart 💀", "error": str(e)})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
