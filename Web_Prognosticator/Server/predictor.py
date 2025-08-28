import pandas as pd
from prophet import Prophet
import sys
from datetime import timedelta


def forecast_counts(group, turning_pattern, vehicle_class, time_interval):
    """
    Forecasts the vehicle counts for a specific turning pattern and vehicle class.
    Considers the specified time interval for prediction.
    """
    # Sort by timestamp to ensure proper time series ordering
    group = group.sort_values('timestamp')

    # Calculate appropriate aggregation frequency based on data density
    time_range = (group['timestamp'].max() - group['timestamp'].min()).total_seconds()
    data_points = len(group)

    # Determine dynamic aggregation interval (minimum 10 seconds)
    if data_points > 0:
        avg_interval = max(10, min(int(time_range / data_points), time_interval))
    else:
        avg_interval = time_interval

    # Aggregate data into appropriate time intervals
    group = group.set_index('timestamp').resample(f'{avg_interval}S')['count'].sum().fillna(0).reset_index()

    #print(f"Training model for Turning Pattern: {turning_pattern}, Vehicle Class: {vehicle_class}")
    #print(f"Data points after aggregation: {len(group)}")
    #print(f"Aggregation interval: {avg_interval} seconds")

    # If there's very limited data, use simple moving average
    if len(group) < 4:
        #print(f"Limited data for {turning_pattern} {vehicle_class}. Using moving average prediction.")
        avg_count = group['count'].mean()
        future_periods = max(1, int(time_interval / avg_interval))
        last_timestamp = group['timestamp'].max()

        predictions = []
        for i in range(future_periods):
            future_timestamp = last_timestamp + timedelta(seconds=(i + 1) * avg_interval)
            predictions.append({
                'Turning Pattern': turning_pattern,
                'Vehicle Class': vehicle_class,
                'Timestamp': future_timestamp,
                'Predicted Count': max(0, round(avg_count))
            })

        return pd.DataFrame(predictions)

    try:
        # Prepare data for Prophet
        df = group.rename(columns={'timestamp': 'ds', 'count': 'y'})

        # Configure Prophet model with appropriate parameters
        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=False,
            daily_seasonality=True,
            interval_width=0.95,
            changepoint_prior_scale=0.05
        )

        # Add custom seasonality based on time interval
        if time_interval <= 3600:  # If prediction window is <= 1 hour
            model.add_seasonality(
                name='custom_seasonality',
                period=3600,  # 1-hour period
                fourier_order=5
            )

        model.fit(df)

        # Calculate future periods based on time_interval
        future_periods = max(1, int(time_interval / avg_interval))
        future = model.make_future_dataframe(
            periods=future_periods,
            freq=f'{avg_interval}S'
        )

        # Generate predictions
        forecast = model.predict(future)

        # Prepare results
        predictions = []
        for _, row in forecast.tail(future_periods).iterrows():
            predictions.append({
                'Turning Pattern': turning_pattern,
                'Vehicle Class': vehicle_class,
                'Timestamp': row['ds'],
                'Predicted Count': max(0, round(row['yhat']))
            })

        return pd.DataFrame(predictions)

    except Exception as e:
        print(f"Error during forecasting for {turning_pattern} {vehicle_class}: {e}")
        return None


def main(input_csv, time_interval):
    """
    Main function to process the input CSV and make predictions.
    """
    # Load and preprocess the input data
    data = pd.read_csv(input_csv)
    data['timestamp'] = pd.to_datetime(data['timestamp'])
    data['turning_pattern'] = data['start_point'] + data['end_point']

    # Filter valid vehicle classes
    valid_classes = ['Bicycle', 'Car', 'Two Wheeler', 'Truck', 'Bus']
    data = data[data['vehicle_class'].isin(valid_classes)]

    # Calculate vehicle counts
    data['count'] = 1
    grouped_data = data.groupby(['turning_pattern', 'vehicle_class', 'timestamp']).size().reset_index(name='count')

    # Initialize forecasts list
    forecasts = []

    # Generate forecasts for each group
    for (turning_pattern, vehicle_class), group in grouped_data.groupby(['turning_pattern', 'vehicle_class']):
        #print(f"\nProcessing {turning_pattern} - {vehicle_class}")
        forecast = forecast_counts(group, turning_pattern, vehicle_class, time_interval)
        if forecast is not None:
            forecasts.append(forecast)

    if not forecasts:
        print("No forecasts were generated due to insufficient data.")
        return

    # Combine all forecasts
    result_df = pd.concat(forecasts, ignore_index=True)

    # Pivot the results to match the required output format
    final_result = result_df.pivot_table(
        index=['Turning Pattern', 'Timestamp'],
        columns='Vehicle Class',
        values='Predicted Count',
        aggfunc='sum'
    ).fillna(0).reset_index()

    # Ensure all vehicle classes are present
    for vehicle_class in valid_classes:
        if vehicle_class not in final_result.columns:
            final_result[vehicle_class] = 0

    # Save results
    result_csv = "results/Result.csv"
    final_result.to_csv(result_csv, index=False)
    #print(f"\nPredictions saved to {result_csv}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python predictor.py <input_csv> <time_interval>")
        sys.exit(1)

    input_csv = sys.argv[1]
    time_interval = int(sys.argv[2])  # Prediction time interval in seconds
    main(input_csv, time_interval)
