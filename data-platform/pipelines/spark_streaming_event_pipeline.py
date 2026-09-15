"""
MFILM PySpark Structured Streaming Pipeline
Consumes streaming events from Kafka, writes raw Parquet to MinIO Data Lake,
and sinks real-time aggregates to ClickHouse.
"""

import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col, to_date, date_format
from pyspark.sql.types import StructType, StructField, StringType

# 1. Event Schema Definition for PySpark
EVENT_SCHEMA = StructType([
    StructField("eventId", StringType(), True),
    StructField("eventType", StringType(), True),
    StructField("eventVersion", StringType(), True),
    StructField("occurredAt", StringType(), True),
    StructField("receivedAt", StringType(), True),
    StructField("userId", StringType(), True),
    StructField("sessionId", StringType(), True),
    StructField("movieId", StringType(), True),
    StructField("episodeId", StringType(), True),
    StructField("metadata", StringType(), True),
    StructField("clientIp", StringType(), True),
    StructField("userAgent", StringType(), True),
])

def create_spark_session():
    KAFKA_PKG = "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.0"
    HADOOP_AWS_PKG = "org.apache.hadoop:hadoop-aws:3.3.4"

    return SparkSession.builder \
        .appName("MfilmStreamingEventPipeline") \
        .config("spark.jars.packages", f"{KAFKA_PKG},{HADOOP_AWS_PKG}") \
        .config("spark.hadoop.fs.s3a.endpoint", os.getenv("MINIO_ENDPOINT", "http://localhost:9010")) \
        .config("spark.hadoop.fs.s3a.access.key", os.getenv("MINIO_ROOT_USER", "mfilm_minio_admin")) \
        .config("spark.hadoop.fs.s3a.secret.key", os.getenv("MINIO_ROOT_PASSWORD", "mfilm_minio_secret_key")) \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .getOrCreate()

def run_pipeline():
    spark = create_spark_session()
    spark.sparkContext.setLogLevel("WARN")

    kafka_bootstrap = os.getenv("KAFKA_BROKERS", "localhost:9094")
    kafka_topic = os.getenv("KAFKA_TOPIC_EVENTS", "mfilm.streaming.events")

    print(f"[*] Starting PySpark streaming from Kafka: {kafka_bootstrap} on topic: {kafka_topic}")

    # Read stream from Kafka
    kafka_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", kafka_bootstrap) \
        .option("subscribe", kafka_topic) \
        .option("startingOffsets", "latest") \
        .load()

    # Parse JSON value
    events_df = kafka_df.selectExpr("CAST(value AS STRING) as json_payload") \
        .select(from_json(col("json_payload"), EVENT_SCHEMA).alias("data")) \
        .select("data.*") \
        .withColumn("date", to_date(col("occurredAt")))

    # Sink 1: Write raw Parquet files to MinIO Data Lake partitioned by date and eventType
    lake_query = events_df.writeStream \
        .format("parquet") \
        .partitionBy("date", "eventType") \
        .option("path", "s3a://mfilm-lake/raw-events/") \
        .option("checkpointLocation", "s3a://mfilm-lake/checkpoints/raw-events/") \
        .outputMode("append") \
        .start()

    # Sink 2: Console / Micro-batch monitor (for debugging and local verification)
    console_query = events_df.writeStream \
        .format("console") \
        .outputMode("append") \
        .option("truncate", "false") \
        .start()

    print("[+] Streaming queries successfully initialized.")
    lake_query.awaitTermination()

if __name__ == "__main__":
    run_pipeline()
