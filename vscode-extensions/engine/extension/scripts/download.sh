ENGINE_DOWNLOAD_URL=$1
ENGINE_DIR=./engine;

echo engine download url set to: $ENGINE_DOWNLOAD_URL

rm -r $ENGINE_DIR

curl --create-dirs -O --output-dir $ENGINE_DIR/ $ENGINE_DOWNLOAD_URL

unzip $ENGINE_DIR/*.zip -d $ENGINE_DIR/AxonIvyEngine
unzip $ENGINE_DIR/AxonIvyEngine/*.zip -d $ENGINE_DIR/AxonIvyEngine

rm $ENGINE_DIR/AxonIvyEngine/*.zip
rm $ENGINE_DIR/*.zip
