from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
# import subprocess
import predictor
import os
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route('/predict', methods=['POST'])
def predict_vehicle_traffic():
    try:
        # print("Starting the try block of /predict - POST...")

        # print("Checking for the input file in request...")
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        # print("File found in the request.")

        # print("Extracting the file from the request...")
        csv_file = request.files['file']
        time_interval = request.form.get('timeInterval')
        # print("Extraction successful.")

        # Validate time interval
        if not time_interval or not time_interval.isdigit():
            return jsonify({'error': 'Invalid time interval'}), 400
        else:
            time_interval = int(time_interval)

        # print("Saving the input file locally...")
        # Save uploaded file
        input_path = 'uploaded_input.csv'
        csv_file.save(input_path)
        # print("Input file saved locally.")

        # Prepare output path
        output_path = 'results/Result.csv'

        # Run the Python prediction script
        # result = subprocess.run([
        #     'python', 'predictor.py',
        #     input_path,
        #     time_interval
        # ], capture_output=True, text=True)
        try:
            # print("Entered TRY block for prediction process.")
            # print("Starting the predictor...\nCalling predictor.main()...")
            predictor.main(input_path, time_interval)
            # print("Calling predictor.main() successfull.")

        # Check for script execution errors
        # if result.returncode != 0:
        except Exception as e:  # NOQA
            # print("Problem found in input parameters.")
            predictor.main(input_path, time_interval)
            return jsonify({
                'error': 'Prediction script failed',
                # 'details': result.stderr
                'details': "Problem Found in Input Parameters"
            }), 500

        # print("Checking for the Results file locally...")
        # Read and return the results
        if os.path.exists(output_path):
            # print("Results file path found.")
            results_df = pd.read_csv(output_path)
            # print("Returning the data...")
            return jsonify(results_df.to_dict(orient='records'))
        else:
            # print("Result file not found / not generated.")
            return jsonify({'error': 'No results generated'}), 404

    except Exception as e:
        # print("Exception for the first try block.\n", e)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
