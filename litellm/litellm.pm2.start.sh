#!/usr/bin/env bash

source ~/miniforge3/etc/profile.d/conda.sh
conda activate litellm-proxy-env
litellm --config litellm.yaml