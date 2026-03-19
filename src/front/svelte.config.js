import adapter from '@sveltejs/adapter-static';

const config = {
    kit: {
        adapter: adapter({
            fallback: 'index.html'
        })
    },
    vitePlugin: {
        dynamicCompileOptions: ({ filename }) =>
            filename.includes('node_modules') ? undefined : { runes: true }
    }
};

export default config;
