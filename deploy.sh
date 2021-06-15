npm install -f
npm uninstall governor-common
npm install governor-common@git+https://github.com/Governor-DAO/governor-common-private.git -f
RANDDIR="temp_build_$(openssl rand -hex 12)"
BUILD_PATH=$RANDDIR npm run build
if [ -f "$RANDDIR/index.html" ]; then
    rm -rf build
    mv $RANDDIR build
else 
    echo "Deploy failed!"
fi
