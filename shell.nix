with (import (fetchTarball https://github.com/nixos/nixpkgs/archive/nixos-23.05.tar.gz) {});
mkShell {
    buildInputs = [
        nodejs_20
        python311
    ];
}
